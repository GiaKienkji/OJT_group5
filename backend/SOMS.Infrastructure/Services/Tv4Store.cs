using System.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;
using SOMS.Application.Common.Models;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public sealed class Tv4Store
{
    private readonly string _connectionString;
    private readonly ITv4Identity _identity;
    public Tv4Store(SomsDbContext db, ITv4Identity identity)
    {
        _connectionString = db.Database.GetConnectionString() ?? throw new InvalidOperationException("Database configuration is required.");
        _identity = identity;
    }
    public async Task<T> Run<T>(bool write, Func<Tv4Session, Task<T>> action, CancellationToken ct)
    {
        var identity = _identity.Current;
        if (identity.ActorId == Guid.Empty || identity.SchoolId == Guid.Empty) throw new Tv4ForbiddenException("A school membership is required.");
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        var session = new Tv4Session(connection, transaction, identity, ct);
        await session.Execute("SET LOCAL statement_timeout = '15000ms'");
        if (!write) await session.Execute("SET TRANSACTION READ ONLY");
        if (!await session.Exists("SELECT 1 FROM public.school_memberships m JOIN public.profiles p ON p.id=m.user_id AND p.status='active' WHERE m.school_id=@school AND m.user_id=@actor AND m.status='active' AND (m.valid_from IS NULL OR m.valid_from<=CURRENT_DATE) AND (m.valid_to IS NULL OR m.valid_to>=CURRENT_DATE)"))
            throw new Tv4ForbiddenException("Active membership in this school is required.");
        try
        {
            var result = await action(session);
            await transaction.CommitAsync(ct);
            return result;
        }
        catch (PostgresException ex) when (ex.SqlState is "23505" or "23514" or "23503" or "40001" or "40P01")
        {
            throw new InvalidOperationException("The operation conflicts with the current data. Refresh and retry.", ex);
        }
    }
}

public sealed class Tv4Row : Dictionary<string, object?>
{
    public T Get<T>(string key) => this[key] is T value ? value : (T)Convert.ChangeType(this[key]!, typeof(T));
    public T? Optional<T>(string key) where T : struct => !TryGetValue(key, out var value) || value is null ? null : value is T result ? result : (T)Convert.ChangeType(value, typeof(T));
    public string? Text(string key) => TryGetValue(key, out var value) ? value?.ToString() : null;
}

public sealed class Tv4Session
{
    private readonly NpgsqlConnection _connection;
    private readonly NpgsqlTransaction _transaction;
    private readonly CancellationToken _ct;
    public Guid SchoolId { get; }
    public Guid ActorId { get; }
    public Tv4Session(NpgsqlConnection connection, NpgsqlTransaction transaction, Tv4Identity identity, CancellationToken ct)
    { _connection = connection; _transaction = transaction; SchoolId = identity.SchoolId; ActorId = identity.ActorId; _ct = ct; }
    private NpgsqlCommand Command(string sql, (string, object?)[] values)
    {
        var command = new NpgsqlCommand(sql, _connection, _transaction);
        command.Parameters.AddWithValue("school", SchoolId);
        command.Parameters.AddWithValue("actor", ActorId);
        foreach (var (name, value) in values)
        {
            if (value is null) command.Parameters.Add(new NpgsqlParameter(name, NpgsqlDbType.Unknown) { Value = DBNull.Value });
            else command.Parameters.AddWithValue(name, value);
        }
        return command;
    }
    public async Task<List<Tv4Row>> Query(string sql, params (string, object?)[] values)
    {
        await using var command = Command(sql, values);
        await using var reader = await command.ExecuteReaderAsync(_ct);
        var rows = new List<Tv4Row>();
        while (await reader.ReadAsync(_ct))
        {
            var row = new Tv4Row();
            for (var i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = await reader.IsDBNullAsync(i, _ct) ? null
                    : reader.GetDataTypeName(i) == "date" ? reader.GetFieldValue<DateOnly>(i)
                    : reader.GetDataTypeName(i) is "json" or "jsonb" ? JsonSerializer.Deserialize<JsonElement>(reader.GetString(i))
                    : reader.GetValue(i);
            rows.Add(row);
        }
        return rows;
    }
    public async Task<Tv4Row> One(string sql, params (string, object?)[] values) => (await Query(sql, values)).SingleOrDefault() ?? throw new KeyNotFoundException("Resource was not found in this school.");
    public async Task<bool> Exists(string sql, params (string, object?)[] values) => (await Query(sql, values)).Count != 0;
    public async Task<int> Execute(string sql, params (string, object?)[] values)
    { await using var command = Command(sql, values); return await command.ExecuteNonQueryAsync(_ct); }
    public async Task RequirePermission(string permission)
    {
        if (!await Exists("SELECT 1 FROM public.school_memberships m JOIN public.role_permissions p ON p.role_code=m.role_code WHERE m.school_id=@school AND m.user_id=@actor AND m.status='active' AND (m.valid_from IS NULL OR m.valid_from<=CURRENT_DATE) AND (m.valid_to IS NULL OR m.valid_to>=CURRENT_DATE) AND p.permission_code=@permission", ("permission", permission)))
            throw new Tv4ForbiddenException("This action requires an approval permission in this school.");
    }
    public Task Audit(string table, Guid id, string action, object? before, object? after) => Execute("INSERT INTO public.audit_logs(school_id,actor_id,table_name,row_id,operation,before_data,after_data) VALUES(@school,@actor,@table,@id,@action,@before::jsonb,@after::jsonb)",
        ("table", table), ("id", id.ToString()), ("action", action), ("before", before is null ? null : JsonSerializer.Serialize(before)), ("after", after is null ? null : JsonSerializer.Serialize(after)));
    public async Task<Guid> SubmitWorkflow(string type, string subject, string description, Guid? studentId = null)
    {
        var id = Guid.NewGuid();
        await Execute("INSERT INTO public.workflow_requests(id,school_id,requester_id,request_type,subject,description,student_id,status,submitted_at) VALUES(@id,@school,@actor,@type,@subject,@description,@student,'submitted',now()); INSERT INTO public.approval_steps(id,request_id,step_no,assigned_role_code,status) VALUES(@step,@id,1,'school_management','pending'); INSERT INTO public.workflow_events(id,request_id,actor_id,event_type,new_status) VALUES(@event,@id,@actor,'submitted','submitted')", ("id", id), ("type", type), ("subject", subject), ("description", description), ("student", studentId), ("step", Guid.NewGuid()), ("event", Guid.NewGuid()));
        return id;
    }
    public async Task DecideWorkflow(Guid id, DecisionInput input, string permission)
    {
        await RequirePermission(permission);
        var decision = Choice(input.Decision, "approved", "rejected");
        var request = await One("SELECT id,requester_id,status FROM public.workflow_requests WHERE id=@id AND school_id=@school FOR UPDATE", ("id", id));
        if (request.Get<Guid>("requester_id") == ActorId) throw new Tv4ForbiddenException("A requester cannot approve their own request.");
        if (request.Text("status") is not ("submitted" or "in_review")) throw new InvalidOperationException("Only submitted requests can be decided.");
        var step = await One("SELECT id,assigned_user_id,assigned_role_code FROM public.approval_steps WHERE request_id=@id AND status='pending' ORDER BY step_no LIMIT 1 FOR UPDATE", ("id", id));
        if (step.Optional<Guid>("assigned_user_id") is Guid assigned && assigned != ActorId) throw new Tv4ForbiddenException("The approval step is assigned to another user.");
        if (step.Text("assigned_role_code") is string role && !await Exists("SELECT 1 FROM public.school_memberships WHERE school_id=@school AND user_id=@actor AND role_code=@role AND status='active' AND (valid_from IS NULL OR valid_from<=CURRENT_DATE) AND (valid_to IS NULL OR valid_to>=CURRENT_DATE)", ("role", role)))
            throw new Tv4ForbiddenException("The approval step is assigned to another role.");
        await Execute("UPDATE public.approval_steps SET status=@status,acted_by=@actor,acted_at=now(),comment=@note WHERE id=@step; UPDATE public.workflow_requests SET status=@status,decided_at=now(),updated_at=now() WHERE id=@id; INSERT INTO public.workflow_events(id,request_id,actor_id,event_type,old_status,new_status,note) VALUES(@event,@id,@actor,'decision',@old,@status,@note)", ("status", decision), ("note", Optional(input.Note)), ("step", step.Get<Guid>("id")), ("id", id), ("event", Guid.NewGuid()), ("old", request.Text("status")));
    }
    public static string Required(string? value, string field) => string.IsNullOrWhiteSpace(value) || value.Trim().Length > 4000 ? throw new ArgumentException($"{field} is required and must not exceed 4000 characters.") : value.Trim();
    public static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    public static string Choice(string? value, params string[] allowed) => allowed.Contains(value, StringComparer.Ordinal) ? value! : throw new ArgumentException($"Allowed values: {string.Join(", ", allowed)}.");
    public static decimal Money(decimal value, bool zero = false) => (zero ? value < 0 : value <= 0) || decimal.Round(value, 2) != value || value > 9999999999999999m ? throw new ArgumentException("Amount must be non-negative, within range, and have at most two decimal places.") : value;
}
