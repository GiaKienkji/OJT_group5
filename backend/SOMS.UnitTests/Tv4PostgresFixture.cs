using System.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SOMS.Application.Common.Models;
using SOMS.Infrastructure.Data;
using SOMS.Infrastructure.Services;
using SOMS.Infrastructure.Services.Facility;
using SOMS.Infrastructure.Services.Finance;
using Xunit;

namespace SOMS.UnitTests;

public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    { if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SOMS_TV4_TEST_CONNECTION"))) Skip = "Set SOMS_TV4_TEST_CONNECTION to a disposable loopback PostgreSQL database."; }
}

public sealed class Tv4PostgresFixture : IAsyncLifetime
{
    public string ConnectionString { get; private set; } = "";
    public Guid School { get; } = Guid.NewGuid();
    public Guid OtherSchool { get; } = Guid.NewGuid();
    public Guid Actor { get; } = Guid.NewGuid();
    public Guid Approver { get; } = Guid.NewGuid();
    public Guid GuardianUser { get; } = Guid.NewGuid();
    public Guid OtherActor { get; } = Guid.NewGuid();
    public Guid FacilityActor { get; } = Guid.NewGuid();
    public Guid SecondAccountant { get; } = Guid.NewGuid();
    public Guid Year { get; } = Guid.NewGuid();
    public Guid Semester { get; } = Guid.NewGuid();
    public Guid Grade { get; } = Guid.NewGuid();
    public Guid Class { get; } = Guid.NewGuid();
    public Guid Student { get; } = Guid.NewGuid();
    public Guid OtherStudent { get; } = Guid.NewGuid();
    public Guid Staff { get; } = Guid.NewGuid();
    public string TestPassword { get; } = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(24));
    public static string Email(Guid id) => "tv4-" + id.ToString("N") + "@example.invalid";
    private bool _started;
    public sealed class TrustedIdentity : ITv4Identity
    {
        public Tv4Identity Current { get; set; }
        public TrustedIdentity(Guid actor, Guid school) => Current = new(actor, school);
    }
    public Tv4Store Store(Guid? actor = null, Guid? school = null)
    {
        var db = new SomsDbContext(new DbContextOptionsBuilder<SomsDbContext>().UseNpgsql(ConnectionString).Options);
        return new Tv4Store(db, new TrustedIdentity(actor ?? Actor, school ?? School));
    }
    public FinanceService Finance(Guid? actor = null, Guid? school = null) => new(Store(actor, school));
    public FacilityService Facility(Guid? actor = null, Guid? school = null) => new(Store(actor ?? FacilityActor, school));
    public async Task InitializeAsync()
    {
        var connection = Environment.GetEnvironmentVariable("SOMS_TV4_TEST_CONNECTION"); if (string.IsNullOrWhiteSpace(connection)) return;
        var builder = new NpgsqlConnectionStringBuilder(connection);
        if (builder.Host is not ("127.0.0.1" or "localhost" or "::1") || builder.Database != "soms_tv4_integration" || builder.Port != 55432) throw new InvalidOperationException("Relational tests only write soms_tv4_integration on loopback port 55432.");
        await using (var c = new NpgsqlConnection(builder.ConnectionString))
        {
            await c.OpenAsync(); await using var command = new NpgsqlCommand("SELECT current_database(),inet_server_addr()::text,inet_server_port()", c); await using var r = await command.ExecuteReaderAsync(); await r.ReadAsync();
            if (r.GetString(0) != "soms_tv4_integration" || r.GetInt32(2) != 55432 || r.GetString(1) is not ("127.0.0.1/32" or "127.0.0.1" or "::1/128" or "::1")) throw new InvalidOperationException("Unexpected integration server identity.");
        }
        ConnectionString = builder.ConnectionString;
        var fixture = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Fixtures", "tv4_shared_schema.sql"));
        var migration = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Fixtures", "20261118_tv4_operations.sql"));
        if ((await Rows("SELECT table_name FROM information_schema.tables WHERE table_schema IN ('public','tv4','auth') AND table_type='BASE TABLE'")).Count != 0)
            throw new InvalidOperationException("Disposable integration database must be empty before fixture install.");
        _started = true; await Sql(fixture); await Sql(migration);
        await Seed();
    }
    public async Task<int> Sql(string sql, params (string, object?)[] parameters)
    {
        await using var c = new NpgsqlConnection(ConnectionString); await c.OpenAsync(); await using var cmd = new NpgsqlCommand(sql, c);
        foreach (var (key, value) in parameters) cmd.Parameters.AddWithValue(key, value ?? DBNull.Value); return await cmd.ExecuteNonQueryAsync();
    }
    public async Task<List<Tv4Row>> Rows(string sql, params (string, object?)[] parameters)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var session = new Tv4Session(connection, transaction, new(Actor, School), CancellationToken.None);
        return await session.Query(sql, parameters);
    }
    public async Task Seed()
    {
        await Sql("INSERT INTO public.schools(id,code,name) VALUES(@school,'TEST-A','Trường thử nghiệm A'),(@other,'TEST-B','Trường thử nghiệm B')", ("school", School), ("other", OtherSchool));
        foreach (var person in new[] { (Actor, "Kế toán thử nghiệm"), (Approver, "Người duyệt thử nghiệm"), (GuardianUser, "Phụ huynh thử nghiệm"), (OtherActor, "Nhân viên trường B"), (FacilityActor, "Nhân viên CSVC"), (SecondAccountant, "Kế toán thứ hai") })
            await Sql("INSERT INTO auth.users(id,email,encrypted_password) VALUES(@id,@email,@hash); INSERT INTO public.profiles(id,full_name) VALUES(@id,@name)", ("id", person.Item1), ("email", Email(person.Item1)), ("hash", BCrypt.Net.BCrypt.HashPassword(TestPassword, 4)), ("name", person.Item2));
        foreach (var role in new[] { "accountant", "school_management", "facility_staff", "parent" })
            await Sql("INSERT INTO public.roles(code,name_vi) VALUES(@role,@role)", ("role", role));
        foreach (var member in new[] { (Actor, School, "accountant"), (SecondAccountant, School, "accountant"), (FacilityActor, School, "facility_staff"), (Approver, School, "school_management"), (GuardianUser, School, "parent"), (OtherActor, OtherSchool, "accountant") })
            await Sql("INSERT INTO public.school_memberships(school_id,user_id,role_code) VALUES(@school,@user,@role)", ("school", member.Item2), ("user", member.Item1), ("role", member.Item3));
        await Sql("INSERT INTO public.academic_years(id,school_id,name,start_date,end_date) VALUES(@year,@school,'2026-2027','2026-09-01','2027-06-01'); INSERT INTO public.semesters(id,academic_year_id,name,ordinal,start_date,end_date) VALUES(@semester,@year,'Học kỳ 1',1,'2026-09-01','2027-01-31'); INSERT INTO public.grade_levels(id,school_id,grade_number) VALUES(@grade,@school,10); INSERT INTO public.classes(id,school_id,academic_year_id,grade_level_id,code,name) VALUES(@class,@school,@year,@grade,'10A1','Lớp 10A1'); INSERT INTO public.students(id,school_id,student_code,full_name) VALUES(@student,@school,'TEST001','Nguyễn Ánh'),(@otherStudent,@other,'TEST002','Học sinh trường B'); INSERT INTO public.class_enrollments(class_id,student_id) VALUES(@class,@student); INSERT INTO public.staff(id,school_id,user_id,employee_code,full_name,kind) VALUES(@staff,@school,@facility,'TESTNV','Nhân viên kỹ thuật','facility')", ("school", School), ("other", OtherSchool), ("year", Year), ("semester", Semester), ("grade", Grade), ("class", Class), ("student", Student), ("otherStudent", OtherStudent), ("staff", Staff), ("facility", FacilityActor));
        var grants = new Dictionary<string, string[]>
        {
            ["accountant"] = new[] { "finance.manage", "fee_categories.manage", "fee_campaigns.manage", "payments.record", "payments.reconcile", "debts.track" },
            ["facility_staff"] = new[] { "rooms.manage", "assets.manage", "repairs.manage", "workflow.submit" },
            ["school_management"] = new[] { "workflow.approve", "facilities.approve_purchase", "finance.summary_view" }
        };
        foreach (var grant in grants)
            foreach (var permission in grant.Value)
                await Sql("INSERT INTO public.permissions(code,description) VALUES(@code,@code) ON CONFLICT DO NOTHING; INSERT INTO public.role_permissions(role_code,permission_code) VALUES(@role,@code)", ("code", permission), ("role", grant.Key));
        var guardian = Guid.NewGuid();
        await Sql("INSERT INTO public.guardians(id,school_id,user_id,full_name) VALUES(@id,@school,@user,'Phụ huynh thử nghiệm'); INSERT INTO public.student_guardians(student_id,guardian_id,relationship,can_view_finance,verified_at) VALUES(@student,@id,'guardian',true,now())", ("id", guardian), ("school", School), ("user", GuardianUser), ("student", Student));
    }
    public async Task DisposeAsync()
    {
        if (!_started) return;
        await Sql("DROP SCHEMA IF EXISTS tv4 CASCADE;");
        var tables = new[] { "user_sessions", "notifications", "audit_logs", "workflow_events", "approval_steps", "workflow_requests", "maintenance_jobs", "asset_incidents", "asset_loans", "assets", "rooms", "payment_adjustments", "payment_allocations", "payments", "student_charges", "fee_campaigns", "fee_types", "student_guardians", "guardians", "class_enrollments", "students", "classes", "grade_levels", "semesters", "academic_years", "staff", "departments", "school_memberships", "role_permissions", "permissions", "roles", "profiles", "schools" };
        foreach (var table in tables) await Sql("DROP TABLE IF EXISTS public.\"" + table + "\" CASCADE");
        await Sql("DROP SCHEMA IF EXISTS auth CASCADE;");
    }
}
