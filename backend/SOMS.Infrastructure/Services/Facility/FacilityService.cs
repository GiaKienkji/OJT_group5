using SOMS.Application.Common.Models;
using SOMS.Application.Modules.Facility.DTOs;
using SOMS.Application.Modules.Facility.Interfaces;
using static SOMS.Infrastructure.Services.Tv4Session;

namespace SOMS.Infrastructure.Services.Facility;

public sealed class FacilityService : IFacilityService
{
    private readonly Tv4Store _store;
    public FacilityService(Tv4Store store) => _store = store;
    public Task<object> Profile(ProfileUpdate? input, CancellationToken ct) => _store.Run<object>(input is not null, async s => input is null ? await Tv4Queries.Profile(s) : await Tv4Queries.UpdateProfile(s, input), ct);
    public Task<object> Handlers(CancellationToken ct) => _store.Run<object>(false, async s => await Tv4Queries.Handlers(s), ct);
    public Task<object> Dashboard(CancellationToken ct) => Stats(ct);
    public Task<object> Rooms(Guid? id, RoomInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            var code = Required(input.Code, "Code"); var type = Required(input.RoomType, "RoomType"); Choice(input.Status, "available", "maintenance", "closed"); if (input.Capacity <= 0) throw new ArgumentException("Capacity must be positive.");
            var key = id ?? Guid.NewGuid(); Tv4Row? before = null; if (id.HasValue) before = await Room(s, key, true);
            if (id.HasValue) await s.Execute("UPDATE public.rooms SET code=@code,name=@name,room_type=@type,capacity=@capacity,status=@status WHERE id=@id AND school_id=@school", ("code", code), ("name", Optional(input.Name)), ("type", type), ("capacity", input.Capacity), ("status", input.Status), ("id", key));
            else await s.Execute("INSERT INTO public.rooms(id,school_id,code,name,room_type,capacity,status) VALUES(@id,@school,@code,@name,@type,@capacity,@status)", ("id", key), ("code", code), ("name", Optional(input.Name)), ("type", type), ("capacity", input.Capacity), ("status", input.Status));
            await s.Audit("rooms", key, id.HasValue ? "updated" : "created", before, input); return await Room(s, key);
        }
        return await s.Query("SELECT * FROM public.rooms WHERE school_id=@school ORDER BY code");
    }, ct);
    private static Task<Tv4Row> Room(Tv4Session s, Guid id, bool locked = false) => s.One("SELECT * FROM public.rooms WHERE id=@id AND school_id=@school" + (locked ? " FOR UPDATE" : ""), ("id", id));
    private static string AssetStatus(string status) => Choice(status, "working", "damaged", "maintenance", "retired", "lost");
    public Task<object> Categories(Guid? id, AssetCategoryInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            var name = Required(input.Name, "Name"); var key = id ?? Guid.NewGuid();
            if (id.HasValue)
            {
                var before = await s.One("SELECT * FROM tv4.asset_categories WHERE id=@id AND school_id=@school FOR UPDATE", ("id", key));
                await s.Execute("UPDATE public.assets SET category=@name WHERE school_id=@school AND category=@old; UPDATE tv4.asset_categories SET name=@name,is_active=@active WHERE id=@id AND school_id=@school", ("name", name), ("old", before.Text("name")), ("active", input.IsActive), ("id", key));
                await s.Audit("tv4.asset_categories", key, "updated", before, input);
            }
            else { await s.Execute("INSERT INTO tv4.asset_categories(id,school_id,name,is_active) VALUES(@id,@school,@name,@active)", ("id", key), ("name", name), ("active", input.IsActive)); await s.Audit("tv4.asset_categories", key, "created", null, input); }
            return await s.One("SELECT * FROM tv4.asset_categories WHERE id=@id AND school_id=@school", ("id", key));
        }
        return await s.Query("SELECT c.id,c.name,c.is_active,count(a.id) AS asset_count FROM tv4.asset_categories c LEFT JOIN public.assets a ON a.school_id=c.school_id AND a.category=c.name WHERE c.school_id=@school GROUP BY c.id ORDER BY c.name");
    }, ct);
    private static Task<Tv4Row> Asset(Tv4Session s, Guid id, bool locked = false) => s.One("SELECT a.*,d.condition FROM public.assets a LEFT JOIN tv4.asset_details d ON d.asset_id=a.id AND d.school_id=@school WHERE a.id=@id AND a.school_id=@school" + (locked ? " FOR UPDATE OF a" : ""), ("id", id));
    private static async Task CheckRoom(Tv4Session s, Guid? id)
    { if (id.HasValue) { var room = await Room(s, id.Value); if (room.Text("status") != "available") throw new InvalidOperationException("Room is not available."); } }
    private static async Task NoCheckedOutLoan(Tv4Session s, Guid assetId)
    { if (await s.Exists("SELECT 1 FROM public.asset_loans WHERE asset_id=@id AND status='checked_out' AND returned_at IS NULL", ("id", assetId))) throw new InvalidOperationException("The asset is checked out."); }
    private static Task<List<Tv4Row>> AssetRows(Tv4Session s, AssetQuery q) => s.Query("SELECT a.id,a.code,a.name,a.category,a.serial_no AS serial_number,a.room_id,r.name AS room_name,a.status,a.notes,d.condition FROM public.assets a LEFT JOIN public.rooms r ON r.id=a.room_id AND r.school_id=@school LEFT JOIN tv4.asset_details d ON d.asset_id=a.id AND d.school_id=@school WHERE a.school_id=@school AND (@room::uuid IS NULL OR a.room_id=@room) AND (@category::text IS NULL OR a.category=@category) AND (@status::text IS NULL OR a.status=@status) ORDER BY a.code", ("room", q.RoomId), ("category", Optional(q.Category)), ("status", Optional(q.Status)));
    public Task<object> Assets(Guid? id, AssetInput? input, AssetQuery query, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            var code = Required(input.Code, "Code"); var name = Required(input.Name, "Name"); var category = Required(input.Category, "Category"); AssetStatus(input.Status); await CheckRoom(s, input.RoomId);
            await s.One("SELECT id FROM tv4.asset_categories WHERE school_id=@school AND name=@name AND is_active", ("name", category));
            var key = id ?? Guid.NewGuid(); Tv4Row? before = null; if (id.HasValue) { before = await Asset(s, key, true); await NoCheckedOutLoan(s, key); }
            if (id.HasValue) await s.Execute("UPDATE public.assets SET code=@code,name=@name,category=@category,serial_no=@serial,room_id=@room,status=@status,notes=@notes WHERE id=@id AND school_id=@school", ("code", code), ("name", name), ("category", category), ("serial", Optional(input.SerialNumber)), ("room", input.RoomId), ("status", input.Status), ("notes", Optional(input.Notes)), ("id", key));
            else await s.Execute("INSERT INTO public.assets(id,school_id,code,name,category,serial_no,room_id,status,notes) VALUES(@id,@school,@code,@name,@category,@serial,@room,@status,@notes)", ("id", key), ("code", code), ("name", name), ("category", category), ("serial", Optional(input.SerialNumber)), ("room", input.RoomId), ("status", input.Status), ("notes", Optional(input.Notes)));
            var condition = Optional(input.Condition) ?? before?.Text("condition") ?? "Chưa đánh giá";
            await s.Execute("INSERT INTO tv4.asset_details(asset_id,school_id,condition) VALUES(@id,@school,@condition) ON CONFLICT(asset_id) DO UPDATE SET condition=EXCLUDED.condition", ("id", key), ("condition", condition));
            await s.Audit("assets", key, id.HasValue ? "updated" : "created", before, input); return await Asset(s, key);
        }
        if (query.Status is not null) AssetStatus(query.Status); return await AssetRows(s, query);
    }, ct);
    public Task<object> Assign(AssetAssignInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    { var asset = await Asset(s, input.AssetId, true); await NoCheckedOutLoan(s, input.AssetId); await CheckRoom(s, input.RoomId); await s.Execute("UPDATE public.assets SET room_id=@room WHERE id=@id AND school_id=@school", ("room", input.RoomId), ("id", input.AssetId)); await s.Audit("assets", input.AssetId, "assigned", asset, input); return await Asset(s, input.AssetId); }, ct);
    private static async Task<Tv4Row> SetCondition(Tv4Session s, Guid id, AssetConditionInput input, string action)
    {
        Required(input.Condition, "Condition"); AssetStatus(input.Status); var before = await Asset(s, id, true);
        await s.Execute("UPDATE public.assets SET status=@status WHERE id=@id AND school_id=@school; INSERT INTO tv4.asset_details(asset_id,school_id,condition) VALUES(@id,@school,@condition) ON CONFLICT(asset_id) DO UPDATE SET condition=EXCLUDED.condition", ("status", input.Status), ("id", id), ("condition", input.Condition.Trim())); await s.Audit("assets", id, action, before, input); return await Asset(s, id);
    }
    public Task<object> Condition(Guid id, AssetConditionInput input, CancellationToken ct) => _store.Run<object>(true, async s => { await NoCheckedOutLoan(s, id); return await SetCondition(s, id, input, "condition_updated"); }, ct);
    public Task<object> History(Guid id, CancellationToken ct) => _store.Run<object>(false, async s => { await Asset(s, id); return await Tv4Queries.History(s, "assets", id); }, ct);
    public Task<object> Inventory(Guid? id, InventoryInput? input, AssetQuery query, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            Required(input.Title, "Title"); if (input.Observations is null || input.Observations.Count == 0 || input.Observations.Any(o => o is null) || input.Observations.Select(o => o.AssetId).Distinct().Count() != input.Observations.Count) throw new ArgumentException("Unique counted observations are required.");
            var key = Guid.NewGuid(); await s.Execute("INSERT INTO tv4.inventories(id,school_id,title,counted_by) VALUES(@id,@school,@title,@actor)", ("id", key), ("title", input.Title.Trim()));
            foreach (var observation in input.Observations)
            {
                var asset = await Asset(s, observation.AssetId, true); AssetStatus(observation.Status); Required(observation.Condition, "Condition"); if (observation.ObservedRoomId.HasValue) await Room(s, observation.ObservedRoomId.Value);
                await s.Execute("INSERT INTO tv4.inventory_observations(inventory_id,asset_id,expected_room_id,expected_status,expected_condition,observed_room_id,condition,status,present) VALUES(@inventory,@asset,@expected,@expectedStatus,@expectedCondition,@observed,@condition,@status,@present)", ("inventory", key), ("asset", observation.AssetId), ("expected", asset.Optional<Guid>("room_id")), ("expectedStatus", asset.Text("status")), ("expectedCondition", asset.Text("condition")), ("observed", observation.ObservedRoomId), ("condition", observation.Condition.Trim()), ("status", observation.Status), ("present", observation.Present));
            }
            await s.Audit("tv4.inventories", key, "counted", null, input); id = key;
        }
        if (id.HasValue) return new { Session = await s.One("SELECT * FROM tv4.inventories WHERE id=@id AND school_id=@school", ("id", id)), Observations = await s.Query("SELECT o.*,a.code,a.name,(NOT o.present OR o.expected_room_id IS DISTINCT FROM o.observed_room_id OR o.expected_status<>o.status OR o.expected_condition IS DISTINCT FROM o.condition) AS discrepancy FROM tv4.inventory_observations o JOIN tv4.inventories i ON i.id=o.inventory_id AND i.school_id=@school JOIN public.assets a ON a.id=o.asset_id AND a.school_id=@school WHERE i.id=@id ORDER BY a.code", ("id", id)) };
        return new { Assets = await AssetRows(s, query), Sessions = await s.Query("SELECT * FROM tv4.inventories WHERE school_id=@school ORDER BY counted_at DESC") };
    }, ct);
    private static Task<Tv4Row> Loan(Tv4Session s, Guid id) => s.One("SELECT l.*,d.purpose,d.handover_by,d.returned_by FROM public.asset_loans l JOIN public.assets a ON a.id=l.asset_id AND a.school_id=@school LEFT JOIN tv4.loan_details d ON d.loan_id=l.id AND d.school_id=@school WHERE l.id=@id FOR UPDATE OF l", ("id", id));
    public Task<object> Loans(BorrowInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            var asset = await Asset(s, input.AssetId, true); Required(input.Purpose, "Purpose"); if (asset.Text("status") != "working") throw new InvalidOperationException("Only working assets can be borrowed.");
            if (await s.Exists("SELECT 1 FROM public.maintenance_jobs WHERE asset_id=@id AND status IN ('planned','in_progress')", ("id", input.AssetId))) throw new InvalidOperationException("Asset has unfinished repair or maintenance work.");
            if (input.DueAt.HasValue && input.DueAt <= DateTimeOffset.UtcNow) throw new ArgumentException("DueAt must be in the future.");
            if (await s.Exists("SELECT 1 FROM public.asset_loans WHERE asset_id=@id AND status IN ('requested','approved','checked_out')", ("id", input.AssetId))) throw new InvalidOperationException("An open loan already exists.");
            var id = Guid.NewGuid(); await s.Execute("INSERT INTO public.asset_loans(id,asset_id,borrower_user_id,due_at,status,notes) VALUES(@id,@asset,@actor,@due,'requested',@purpose); INSERT INTO tv4.loan_details(loan_id,school_id,purpose) VALUES(@id,@school,@purpose)", ("id", id), ("asset", input.AssetId), ("due", input.DueAt?.ToUniversalTime()), ("purpose", input.Purpose.Trim())); await s.Audit("asset_loans", id, "requested", null, input);
        }
        return await s.Query("SELECT l.*,a.code AS asset_code,a.name AS asset_name,p.full_name AS requester_name,d.purpose,d.handover_by,d.returned_by FROM public.asset_loans l JOIN public.assets a ON a.id=l.asset_id AND a.school_id=@school JOIN public.profiles p ON p.id=l.borrower_user_id LEFT JOIN tv4.loan_details d ON d.loan_id=l.id AND d.school_id=@school ORDER BY l.requested_at DESC");
    }, ct);
    public Task<object> Handover(Guid id, HandoverInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        var loan = await Loan(s, id); if (loan.Text("status") == "checked_out") return loan; var asset = await Asset(s, loan.Get<Guid>("asset_id"), true);
        if (loan.Text("status") is not ("requested" or "approved") || asset.Text("status") != "working") throw new InvalidOperationException("A requested or approved loan and working asset are required.");
        if (!await s.Exists("SELECT 1 FROM public.school_memberships m JOIN public.profiles p ON p.id=m.user_id AND p.status='active' WHERE m.user_id=@borrower AND m.school_id=@school AND m.status='active' AND (m.valid_from IS NULL OR m.valid_from<=CURRENT_DATE) AND (m.valid_to IS NULL OR m.valid_to>=CURRENT_DATE)", ("borrower", loan.Get<Guid>("borrower_user_id")))) throw new InvalidOperationException("Borrower has no active membership in this school.");
        if (await s.Exists("SELECT 1 FROM public.asset_loans WHERE asset_id=@asset AND id<>@id AND status='checked_out' AND returned_at IS NULL", ("asset", asset.Get<Guid>("id")), ("id", id))) throw new InvalidOperationException("Asset is already checked out.");
        if (await s.Exists("SELECT 1 FROM public.maintenance_jobs WHERE asset_id=@id AND status IN ('planned','in_progress')", ("id", asset.Get<Guid>("id")))) throw new InvalidOperationException("Asset has unfinished repair or maintenance work.");
        await s.Execute("UPDATE public.asset_loans SET status='checked_out',checked_out_at=now(),approved_by=COALESCE(approved_by,@actor),notes=COALESCE(@note,notes) WHERE id=@id; INSERT INTO tv4.loan_details(loan_id,school_id,purpose,handover_by) VALUES(@id,@school,@purpose,@actor) ON CONFLICT(loan_id) DO UPDATE SET handover_by=@actor", ("id", id), ("note", Optional(input.Note)), ("purpose", loan.Text("purpose") ?? loan.Text("notes") ?? "Shared loan")); await s.Audit("asset_loans", id, "handed_over", loan, input); return await Loan(s, id);
    }, ct);
    public Task<object> Return(Guid id, AssetConditionInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        var loan = await Loan(s, id); if (loan.Text("status") == "returned") return loan; if (loan.Text("status") != "checked_out") throw new InvalidOperationException("Only a checked-out loan can be returned.");
        await SetCondition(s, loan.Get<Guid>("asset_id"), input, "returned_condition"); await s.Execute("UPDATE public.asset_loans SET status='returned',returned_at=now() WHERE id=@id; UPDATE tv4.loan_details SET returned_by=@actor WHERE loan_id=@id AND school_id=@school", ("id", id)); await s.Audit("asset_loans", id, "returned", loan, input); return await Loan(s, id);
    }, ct);
    public Task<object> Incidents(IncidentInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            await Asset(s, input.AssetId, true); Choice(input.Severity, "low", "medium", "high", "critical"); Required(input.Description, "Description"); var id = Guid.NewGuid(); await s.Execute("INSERT INTO public.asset_incidents(id,asset_id,reported_by,priority,description,status) VALUES(@id,@asset,@actor,@priority,@description,'open')", ("id", id), ("asset", input.AssetId), ("priority", input.Severity), ("description", input.Description.Trim())); await s.Audit("asset_incidents", id, "reported", null, input);
        }
        return await s.Query("SELECT i.*,a.code AS asset_code,a.name AS asset_name,p.full_name AS reporter_name FROM public.asset_incidents i JOIN public.assets a ON a.id=i.asset_id AND a.school_id=@school JOIN public.profiles p ON p.id=i.reported_by ORDER BY i.reported_at DESC");
    }, ct);
    private static Task<Tv4Row> Incident(Tv4Session s, Guid id) => s.One("SELECT i.* FROM public.asset_incidents i JOIN public.assets a ON a.id=i.asset_id AND a.school_id=@school WHERE i.id=@id FOR UPDATE OF i", ("id", id));
    public Task<object> Severity(Guid id, SeverityInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    { Choice(input.Severity, "low", "medium", "high", "critical"); var before = await Incident(s, id); if (before.Text("status") is "resolved" or "closed") throw new InvalidOperationException("Closed incidents cannot be classified."); await s.Execute("UPDATE public.asset_incidents SET priority=@priority WHERE id=@id", ("priority", input.Severity), ("id", id)); await s.Audit("asset_incidents", id, "classified", before, input); return await Incident(s, id); }, ct);
    private static Task<Tv4Row> Job(Tv4Session s, Guid id) => s.One("SELECT j.*,d.title,d.repeat_interval_months,d.result_condition,d.result_status,d.result_recorded_at,d.result_actor,d.completed_by FROM public.maintenance_jobs j JOIN public.assets a ON a.id=j.asset_id AND a.school_id=@school LEFT JOIN tv4.job_details d ON d.job_id=j.id AND d.school_id=@school WHERE j.id=@id FOR UPDATE OF j", ("id", id));
    private static async Task<List<Tv4Row>> JobRows(Tv4Session s, Guid? assetId, string? status, bool repairsOnly)
    {
        var rows = await s.Query("SELECT j.*,a.code AS asset_code,a.name AS asset_name,d.title,d.repeat_interval_months,d.result_condition,d.result_status,d.result_recorded_at,d.result_actor,d.completed_by,st.full_name AS handler_name FROM public.maintenance_jobs j JOIN public.assets a ON a.id=j.asset_id AND a.school_id=@school LEFT JOIN tv4.job_details d ON d.job_id=j.id AND d.school_id=@school LEFT JOIN public.staff st ON st.id=j.assigned_staff_id AND st.school_id=@school WHERE (@asset::uuid IS NULL OR j.asset_id=@asset) AND (@status::text IS NULL OR j.status=@status) AND (NOT @repairs OR j.incident_id IS NOT NULL) ORDER BY j.scheduled_for DESC NULLS LAST,j.id", ("asset", assetId), ("status", status), ("repairs", repairsOnly));
        foreach (var row in rows) row["history"] = await Tv4Queries.History(s, "maintenance_jobs", row.Get<Guid>("id")); return rows;
    }
    public Task<object> Repairs(RepairInput? input, Guid? assetId, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            var incident = await Incident(s, input.IncidentId); Required(input.Title, "Title"); if (incident.Text("status") is "resolved" or "closed") throw new InvalidOperationException("Incident is already closed.");
            if (await s.Exists("SELECT 1 FROM public.maintenance_jobs WHERE incident_id=@id AND status NOT IN ('done','cancelled')", ("id", input.IncidentId))) throw new InvalidOperationException("Incident already has an open repair job.");
            var id = Guid.NewGuid(); await s.Execute("INSERT INTO public.maintenance_jobs(id,asset_id,incident_id,scheduled_for,cost,status) VALUES(@id,@asset,@incident,@date,0,'planned'); INSERT INTO tv4.job_details(job_id,school_id,title) VALUES(@id,@school,@title)", ("id", id), ("asset", incident.Get<Guid>("asset_id")), ("incident", input.IncidentId), ("date", input.ScheduledFor), ("title", input.Title.Trim())); await s.Audit("maintenance_jobs", id, "repair_created", null, input);
        }
        return await JobRows(s, assetId, null, true);
    }, ct);
    private static async Task EnsureJobDetails(Tv4Session s, Tv4Row job) => await s.Execute("INSERT INTO tv4.job_details(job_id,school_id,title) VALUES(@id,@school,@title) ON CONFLICT(job_id) DO NOTHING", ("id", job.Get<Guid>("id")), ("title", job.Text("title") ?? "Sửa chữa / bảo trì"));
    public Task<object> Handler(Guid id, HandlerInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        var job = await Job(s, id); if (job.Text("status") is "done" or "cancelled") throw new InvalidOperationException("Job is closed."); await s.One("SELECT id FROM public.staff WHERE id=@id AND school_id=@school AND employment_status='active'", ("id", input.StaffId)); await EnsureJobDetails(s, job);
        await s.Execute("UPDATE public.maintenance_jobs SET assigned_staff_id=@staff WHERE id=@id", ("staff", input.StaffId), ("id", id)); if (job.Optional<Guid>("incident_id").HasValue) await s.Execute("UPDATE public.asset_incidents SET assignee_id=@staff,status='assigned' WHERE id=@incident", ("staff", input.StaffId), ("incident", job.Optional<Guid>("incident_id"))); await s.Audit("maintenance_jobs", id, "handler_assigned", job, input); return await Job(s, id);
    }, ct);
    public Task<object> Progress(Guid id, ProgressInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        Required(input.ProgressNote, "ProgressNote"); var job = await Job(s, id); if (job.Text("status") is "done" or "cancelled") throw new InvalidOperationException("Job is closed."); if (!job.Optional<Guid>("assigned_staff_id").HasValue) throw new InvalidOperationException("Assign a handler before progress.");
        await s.Execute("UPDATE public.maintenance_jobs SET status='in_progress',started_at=COALESCE(started_at,now()) WHERE id=@id", ("id", id)); if (job.Optional<Guid>("incident_id").HasValue) await s.Execute("UPDATE public.asset_incidents SET status='in_progress' WHERE id=@id", ("id", job.Optional<Guid>("incident_id"))); await s.Audit("maintenance_jobs", id, "progress", job, input); return await Job(s, id);
    }, ct);
    private static async Task<Tv4Row> RecordResult(Tv4Session s, Guid id, WorkResultInput input)
    {
        Required(input.Result, "Result"); Required(input.Condition, "Condition"); AssetStatus(input.Status); Money(input.Cost, true); var job = await Job(s, id);
        if (job.Text("status") is "done" or "cancelled") throw new InvalidOperationException("Job is closed."); if (!job.Optional<Guid>("assigned_staff_id").HasValue) throw new InvalidOperationException("Assign a handler before recording a result."); await EnsureJobDetails(s, job);
        await s.Execute("UPDATE public.maintenance_jobs SET result_notes=@result,cost=@cost,started_at=COALESCE(started_at,now()),status='in_progress' WHERE id=@id; UPDATE tv4.job_details SET result_condition=@condition,result_status=@status,result_recorded_at=now(),result_actor=@actor WHERE job_id=@id AND school_id=@school", ("result", input.Result.Trim()), ("cost", input.Cost), ("id", id), ("condition", input.Condition.Trim()), ("status", input.Status)); await s.Audit("maintenance_jobs", id, "result_recorded", job, input); return await Job(s, id);
    }
    public Task<object> Result(Guid id, WorkResultInput input, CancellationToken ct) => _store.Run<object>(true, async s => await RecordResult(s, id, input), ct);
    private static async Task<Tv4Row> Finish(Tv4Session s, Guid id)
    {
        var job = await Job(s, id); if (job.Text("status") == "done") return job;
        if (job.Text("status") == "cancelled" || job["result_recorded_at"] is null) throw new InvalidOperationException("Record a result before completion.");
        await SetCondition(s, job.Get<Guid>("asset_id"), new AssetConditionInput(job.Get<string>("result_condition"), job.Get<string>("result_status"), job.Text("result_notes")), "work_completed");
        await s.Execute("UPDATE public.maintenance_jobs SET status='done',completed_at=now() WHERE id=@id; UPDATE tv4.job_details SET completed_by=@actor WHERE job_id=@id AND school_id=@school", ("id", id));
        if (job.Optional<Guid>("incident_id").HasValue) await s.Execute("UPDATE public.asset_incidents SET status='closed',resolved_at=now() WHERE id=@id", ("id", job.Optional<Guid>("incident_id")));
        if (job.Optional<int>("repeat_interval_months") is int months)
        {
            var next = (job.Optional<DateOnly>("scheduled_for") ?? DateOnly.FromDateTime(DateTime.UtcNow)).AddMonths(months); var nextId = Guid.NewGuid();
            if (!await s.Exists("SELECT 1 FROM tv4.job_details WHERE previous_job_id=@id", ("id", id)))
            { await s.Execute("INSERT INTO public.maintenance_jobs(id,asset_id,assigned_staff_id,scheduled_for,cost,status) VALUES(@next,@asset,@staff,@date,0,'planned'); INSERT INTO tv4.job_details(job_id,school_id,title,repeat_interval_months,previous_job_id) VALUES(@next,@school,@title,@months,@previous)", ("next", nextId), ("asset", job.Get<Guid>("asset_id")), ("staff", job.Optional<Guid>("assigned_staff_id")), ("date", next), ("title", job.Text("title")), ("months", months), ("previous", id)); await s.Audit("maintenance_jobs", nextId, "recurring_scheduled", null, new { PreviousJobId = id, Date = next }); }
        }
        await s.Audit("maintenance_jobs", id, "completed", job, null); return await Job(s, id);
    }
    public Task<object> Complete(Guid id, CancellationToken ct) => _store.Run<object>(true, async s => await Finish(s, id), ct);
    public Task<object> Maintenance(MaintenanceInput? input, Guid? assetId, string? status, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (status is not null) Choice(status, "planned", "in_progress", "done", "cancelled");
        if (input is not null)
        {
            await Asset(s, input.AssetId, true); Required(input.Title, "Title"); if (input.MaintenanceDate == default || input.RepeatIntervalMonths is < 1 or > 120) throw new ArgumentException("Maintenance date or recurrence is invalid."); var id = Guid.NewGuid();
            await s.Execute("INSERT INTO public.maintenance_jobs(id,asset_id,scheduled_for,cost,status) VALUES(@id,@asset,@date,0,'planned'); INSERT INTO tv4.job_details(job_id,school_id,title,repeat_interval_months) VALUES(@id,@school,@title,@repeat)", ("id", id), ("asset", input.AssetId), ("date", input.MaintenanceDate), ("title", input.Title.Trim()), ("repeat", input.RepeatIntervalMonths)); await s.Audit("maintenance_jobs", id, "maintenance_scheduled", null, input);
        }
        return await JobRows(s, assetId, status, false);
    }, ct);
    public Task<object> MaintenanceResult(Guid id, WorkResultInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    { var job = await Job(s, id); if (job.Text("status") == "done") return job; if (job.Optional<Guid>("incident_id").HasValue) throw new InvalidOperationException("Repair jobs require result then separate completion confirmation."); await RecordResult(s, id, input); return await Finish(s, id); }, ct);
    public Task<object> Proposals(ProposalInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            Choice(input.Type, "purchase", "replacement"); Required(input.Title, "Title"); Required(input.Description, "Description"); if (input.Quantity <= 0) throw new ArgumentException("Quantity must be positive."); if (input.EstimatedCost.HasValue) Money(input.EstimatedCost.Value, true); if (input.Type == "replacement" && !input.AssetId.HasValue) throw new ArgumentException("Replacement requires an asset."); if (input.AssetId.HasValue) await Asset(s, input.AssetId.Value);
            var workflow = await s.SubmitWorkflow("purchase", input.Title, input.Description); var id = Guid.NewGuid(); await s.Execute("INSERT INTO tv4.proposals(id,school_id,workflow_id,type,title,description,quantity,estimated_cost,asset_id) VALUES(@id,@school,@workflow,@type,@title,@description,@quantity,@cost,@asset)", ("id", id), ("workflow", workflow), ("type", input.Type), ("title", input.Title.Trim()), ("description", input.Description.Trim()), ("quantity", input.Quantity), ("cost", input.EstimatedCost), ("asset", input.AssetId)); await s.Audit("tv4.proposals", id, "submitted", null, input);
        }
        var rows = await s.Query("SELECT p.*,w.status,w.requester_id,w.created_at,w.decided_at FROM tv4.proposals p JOIN public.workflow_requests w ON w.id=p.workflow_id AND w.school_id=@school WHERE p.school_id=@school ORDER BY w.created_at DESC"); foreach (var row in rows) row["history"] = await s.Query("SELECT actor_id,event_type,old_status,new_status,note,created_at FROM public.workflow_events WHERE request_id=@id ORDER BY created_at", ("id", row.Get<Guid>("workflow_id"))); return rows;
    }, ct);
    public Task<object> DecideProposal(Guid id, DecisionInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    { var proposal = await s.One("SELECT * FROM tv4.proposals WHERE id=@id AND school_id=@school FOR UPDATE", ("id", id)); if (proposal.Optional<Guid>("asset_id").HasValue) await Asset(s, proposal.Get<Guid>("asset_id")); await s.DecideWorkflow(proposal.Get<Guid>("workflow_id"), input, "facilities.approve_purchase"); await s.Audit("tv4.proposals", id, "decision", null, input); return new { id, Status = input.Decision }; }, ct);
    public Task<object> Stats(CancellationToken ct) => _store.Run<object>(false, async s => new
    {
        Summary = await s.One("SELECT (SELECT count(*) FROM public.rooms WHERE school_id=@school) AS room_count,(SELECT count(*) FROM public.assets WHERE school_id=@school) AS asset_count,(SELECT count(*) FROM public.assets WHERE school_id=@school AND status='damaged') AS assets_needing_repair,(SELECT count(*) FROM public.maintenance_jobs j JOIN public.assets a ON a.id=j.asset_id WHERE a.school_id=@school AND j.status NOT IN ('done','cancelled') AND j.incident_id IS NOT NULL) AS open_repair_requests,(SELECT count(*) FROM public.maintenance_jobs j JOIN public.assets a ON a.id=j.asset_id WHERE a.school_id=@school AND j.status NOT IN ('done','cancelled') AND j.scheduled_for<=CURRENT_DATE) AS maintenance_due_count,(SELECT count(*) FROM tv4.proposals p JOIN public.workflow_requests w ON w.id=p.workflow_id WHERE p.school_id=@school AND w.status IN ('submitted','in_review')) AS pending_proposals"),
        Incidents = await s.Query("SELECT i.priority AS severity,i.status,count(*) AS count FROM public.asset_incidents i JOIN public.assets a ON a.id=i.asset_id AND a.school_id=@school GROUP BY i.priority,i.status ORDER BY i.priority,i.status")
    }, ct);
    public Task<Tv4File> Export(FacilityExportInput input, CancellationToken ct) => _store.Run(false, async s =>
    {
        Choice(input.ReportType, "inventory", "maintenance"); if (input.FromDate > input.ToDate) throw new ArgumentException("Invalid date range.");
        if (input.ReportType == "inventory")
        {
            if (input.FromDate.HasValue || input.ToDate.HasValue)
                throw new ArgumentException("Inventory reports are current snapshots; date filters apply only to maintenance reports.");
            var rows = await AssetRows(s, new AssetQuery(input.RoomId, input.Category));
            return Tv4Export.Create("Báo cáo tài sản", new[] { "Mã", "Thiết bị", "Danh mục", "Phòng", "Trạng thái", "Tình trạng" }, rows.Select(r => new object?[] { r.Text("code"), r.Text("name"), r.Text("category"), r.Text("room_name"), r.Text("status"), r.Text("condition") }).ToArray(), input.Format, "assets");
        }
        var jobs = await s.Query("SELECT a.code,a.name,d.title,j.scheduled_for,j.completed_at,j.status,j.result_notes,j.cost FROM public.maintenance_jobs j JOIN public.assets a ON a.id=j.asset_id AND a.school_id=@school LEFT JOIN tv4.job_details d ON d.job_id=j.id WHERE (@room::uuid IS NULL OR a.room_id=@room) AND (@category::text IS NULL OR a.category=@category) AND (@from::date IS NULL OR j.scheduled_for>=@from) AND (@to::date IS NULL OR j.scheduled_for<=@to) ORDER BY j.scheduled_for", ("room", input.RoomId), ("category", Optional(input.Category)), ("from", input.FromDate), ("to", input.ToDate));
        return Tv4Export.Create("Báo cáo bảo trì", new[] { "Mã", "Thiết bị", "Công việc", "Ngày hẹn", "Trạng thái", "Kết quả", "Chi phí" }, jobs.Select(r => new object?[] { r.Text("code"), r.Text("name"), r.Text("title"), r["scheduled_for"], r.Text("status"), r.Text("result_notes"), r["cost"] }).ToArray(), input.Format, "maintenance");
    }, ct);
}
