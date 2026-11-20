using System.Text.Json;
using SOMS.Application.Common.Models;
using SOMS.Application.Modules.Finance.DTOs;
using SOMS.Application.Modules.Finance.Interfaces;
using static SOMS.Infrastructure.Services.Tv4Session;

namespace SOMS.Infrastructure.Services.Finance;

public sealed class FinanceService : IFinanceService
{
    private readonly Tv4Store _store;
    public FinanceService(Tv4Store store) => _store = store;
    public Task<object> Profile(ProfileUpdate? input, CancellationToken ct) => _store.Run<object>(input is not null, async s => input is null ? await Tv4Queries.Profile(s) : await Tv4Queries.UpdateProfile(s, input), ct);
    public Task<object> Lookups(LookupQuery query, CancellationToken ct) => _store.Run(false, s => Tv4Queries.Lookups(s, query), ct);
    public Task<object> Dashboard(CancellationToken ct) => _store.Run<object>(false, async s => await s.One("SELECT (SELECT COALESCE(sum(p.amount),0) FROM public.payments p WHERE p.school_id=@school AND p.status IN ('verified','refunded'))-(SELECT COALESCE(sum(a.amount),0) FROM public.payment_adjustments a JOIN public.payments p ON p.id=a.payment_id WHERE p.school_id=@school) AS total_collected,(SELECT COALESCE(sum(c.amount-c.discount-COALESCE(a.paid,0)),0) FROM public.student_charges c JOIN public.fee_campaigns f ON f.id=c.campaign_id LEFT JOIN LATERAL(SELECT sum(pa.amount) AS paid FROM public.payment_allocations pa JOIN public.payments p ON p.id=pa.payment_id AND p.school_id=@school AND p.status IN ('verified','refunded') WHERE pa.charge_id=c.id)a ON true WHERE f.school_id=@school) AS outstanding_debt,(SELECT count(*) FROM public.fee_campaigns WHERE school_id=@school AND status='issued') AS active_campaigns,(SELECT count(*) FROM public.payments WHERE school_id=@school AND status IN ('verified','refunded') AND paid_at>=CURRENT_DATE AND paid_at<CURRENT_DATE+1) AS payments_today,(SELECT count(*) FROM tv4.bank_transactions WHERE school_id=@school AND payment_id IS NULL) AS unreconciled_transactions"), ct);
    public Task<object> Categories(Guid? id, FeeCategoryInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            var code = Required(input.Code, "Code"); var name = Required(input.Name, "Name");
            if (id.HasValue) await s.One("SELECT id FROM public.fee_types WHERE id=@id AND school_id=@school FOR UPDATE", ("id", id));
            var key = id ?? Guid.NewGuid();
            if (id.HasValue) await s.Execute("UPDATE public.fee_types SET code=@code,name=@name,is_active=@active WHERE id=@id AND school_id=@school", ("code", code), ("name", name), ("active", input.IsActive), ("id", key));
            else await s.Execute("INSERT INTO public.fee_types(id,school_id,code,name,is_active) VALUES(@id,@school,@code,@name,@active)", ("id", key), ("code", code), ("name", name), ("active", input.IsActive));
            await s.Audit("fee_types", key, id.HasValue ? "updated" : "created", null, input);
            return await s.One("SELECT id,code,name,is_active FROM public.fee_types WHERE id=@id AND school_id=@school", ("id", key));
        }
        return await s.Query("SELECT id,code,name,is_active FROM public.fee_types WHERE school_id=@school ORDER BY name");
    }, ct);
    public Task<object> Campaigns(Guid? id, FeeCampaignInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            Required(input.Name, "Name"); Choice(input.Status, "draft", "issued", "closed");
            await s.One("SELECT id FROM public.academic_years WHERE id=@id AND school_id=@school", ("id", input.AcademicYearId));
            if (input.SemesterId.HasValue) await s.One("SELECT id FROM public.semesters WHERE id=@id AND academic_year_id=@year", ("id", input.SemesterId), ("year", input.AcademicYearId));
            var key = id ?? Guid.NewGuid();
            if (id.HasValue)
            {
                var old = await Campaign(s, key, true);
                if (old.Get<Guid>("academic_year_id") != input.AcademicYearId && await s.Exists("SELECT 1 FROM public.student_charges WHERE campaign_id=@id", ("id", key))) throw new InvalidOperationException("An assigned campaign cannot change its academic year.");
                await s.Execute("UPDATE public.fee_campaigns SET name=@name,academic_year_id=@year,due_on=@due,status=@status WHERE id=@id AND school_id=@school", ("name", input.Name.Trim()), ("year", input.AcademicYearId), ("due", input.DueDate), ("status", input.Status), ("id", key));
            }
            else await s.Execute("INSERT INTO public.fee_campaigns(id,school_id,academic_year_id,name,due_on,status) VALUES(@id,@school,@year,@name,@due,@status)", ("id", key), ("year", input.AcademicYearId), ("name", input.Name.Trim()), ("due", input.DueDate), ("status", input.Status));
            await s.Execute("INSERT INTO tv4.campaign_details(campaign_id,school_id,semester_id) VALUES(@id,@school,@semester) ON CONFLICT(campaign_id) DO UPDATE SET semester_id=EXCLUDED.semester_id", ("id", key), ("semester", input.SemesterId));
            await s.Audit("fee_campaigns", key, id.HasValue ? "updated" : "created", null, input);
            return await Campaign(s, key);
        }
        return await s.Query("SELECT f.*,d.semester_id,y.name AS academic_year_name FROM public.fee_campaigns f JOIN public.academic_years y ON y.id=f.academic_year_id AND y.school_id=@school LEFT JOIN tv4.campaign_details d ON d.campaign_id=f.id WHERE f.school_id=@school ORDER BY y.start_date DESC,f.name");
    }, ct);
    private static Task<Tv4Row> Campaign(Tv4Session s, Guid id, bool locked = false) => s.One("SELECT f.*,d.semester_id FROM public.fee_campaigns f LEFT JOIN tv4.campaign_details d ON d.campaign_id=f.id WHERE f.id=@id AND f.school_id=@school" + (locked ? " FOR UPDATE OF f" : ""), ("id", id));
    public Task<object> Rules(Guid campaignId, List<FeeRuleInput>? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        var campaign = await Campaign(s, campaignId, input is not null);
        if (input is not null)
        {
            if (campaign.Text("status") == "closed") throw new InvalidOperationException("Closed campaigns cannot change rules.");
            var keys = new HashSet<string>();
            foreach (var rule in input)
            {
                Money(rule.Amount, true);
                await s.One("SELECT id FROM public.fee_types WHERE id=@id AND school_id=@school AND is_active", ("id", rule.FeeCategoryId));
                if (!rule.ClassId.HasValue && !rule.GradeLevelId.HasValue) throw new ArgumentException("A grade or class is required.");
                if (rule.GradeLevelId.HasValue) await s.One("SELECT id FROM public.grade_levels WHERE id=@id AND school_id=@school", ("id", rule.GradeLevelId));
                if (rule.ClassId.HasValue) await s.One("SELECT id FROM public.classes WHERE id=@id AND school_id=@school AND academic_year_id=@year AND (@grade::uuid IS NULL OR grade_level_id=@grade)", ("id", rule.ClassId), ("year", campaign.Get<Guid>("academic_year_id")), ("grade", rule.GradeLevelId));
                if (!keys.Add($"{rule.FeeCategoryId}:{rule.ClassId?.ToString() ?? "g" + rule.GradeLevelId}")) throw new ArgumentException("Duplicate fee rule.");
            }
            await s.Execute("DELETE FROM tv4.fee_rules WHERE campaign_id=@id AND school_id=@school", ("id", campaignId));
            foreach (var rule in input) await s.Execute("INSERT INTO tv4.fee_rules(id,school_id,campaign_id,fee_type_id,grade_level_id,class_id,amount,due_on) VALUES(@id,@school,@campaign,@fee,@grade,@class,@amount,@due)", ("id", Guid.NewGuid()), ("campaign", campaignId), ("fee", rule.FeeCategoryId), ("grade", rule.GradeLevelId), ("class", rule.ClassId), ("amount", rule.Amount), ("due", rule.DueDate));
            await s.Audit("fee_campaigns", campaignId, "rules_updated", null, input);
        }
        return await s.Query("SELECT id,fee_type_id AS fee_category_id,grade_level_id,class_id,amount,due_on AS due_date FROM tv4.fee_rules WHERE campaign_id=@id AND school_id=@school ORDER BY id", ("id", campaignId));
    }, ct);
    public Task<object> Apply(Guid campaignId, ApplyFeesInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        ArgumentNullException.ThrowIfNull(input.StudentIds);
        var campaign = await Campaign(s, campaignId, true);
        if (campaign.Text("status") == "closed") throw new InvalidOperationException("Closed campaigns cannot assign fees.");
        foreach (var id in input.StudentIds.Distinct()) await s.One("SELECT id FROM public.students WHERE id=@id AND school_id=@school AND status='enrolled'", ("id", id));
        var selected = await s.Query("SELECT DISTINCT ON(st.id,r.fee_type_id) st.id AS student_id,c.id AS class_id,r.fee_type_id,r.amount,COALESCE(r.due_on,f.due_on) AS due_on FROM public.students st JOIN public.class_enrollments e ON e.student_id=st.id AND e.status='active' JOIN public.classes c ON c.id=e.class_id AND c.school_id=@school JOIN public.fee_campaigns f ON f.id=@campaign AND f.academic_year_id=c.academic_year_id JOIN tv4.fee_rules r ON r.campaign_id=f.id AND r.school_id=@school AND (r.class_id=c.id OR (r.class_id IS NULL AND r.grade_level_id=c.grade_level_id)) JOIN public.fee_types ft ON ft.id=r.fee_type_id AND ft.school_id=@school AND ft.is_active WHERE st.school_id=@school AND st.status='enrolled' AND (cardinality(@students::uuid[])=0 OR st.id=ANY(@students)) ORDER BY st.id,r.fee_type_id,(r.class_id IS NOT NULL) DESC,e.enrolled_on DESC", ("campaign", campaignId), ("students", input.StudentIds.Distinct().ToArray()));
        if (selected.Count == 0) throw new InvalidOperationException("No enrolled students match configured fee rules.");
        var created = 0;
        foreach (var row in selected)
        {
            var id = Guid.NewGuid();
            var count = await s.Execute("INSERT INTO public.student_charges(id,campaign_id,student_id,fee_type_id,amount,discount,due_on) VALUES(@id,@campaign,@student,@fee,@amount,0,@due) ON CONFLICT(campaign_id,student_id,fee_type_id) DO NOTHING", ("id", id), ("campaign", campaignId), ("student", row.Get<Guid>("student_id")), ("fee", row.Get<Guid>("fee_type_id")), ("amount", row.Get<decimal>("amount")), ("due", row.Optional<DateOnly>("due_on")));
            if (count != 0)
            {
                created++;
                await s.Execute("INSERT INTO tv4.charge_details(charge_id,school_id,class_id) VALUES(@charge,@school,@class)", ("charge", id), ("class", row.Get<Guid>("class_id")));
                await s.Audit("student_charges", id, "assigned", null, row);
            }
        }
        await s.Execute("UPDATE public.fee_campaigns SET status='issued' WHERE id=@id AND school_id=@school", ("id", campaignId));
        return new { CreatedCount = created, DuplicateCount = selected.Count - created };
    }, ct);
    private const string ChargeSql = """
        SELECT q.* FROM (
          SELECT ch.id,ch.student_id,st.student_code,st.full_name AS student_name,c.id AS class_id,c.name AS class_name,c.grade_level_id,
            ch.fee_type_id AS fee_category_id,ft.name AS fee_name,f.id AS campaign_id,f.name AS campaign_name,f.academic_year_id,d.semester_id,
            ch.amount,ch.discount,ch.amount-ch.discount AS amount_due,COALESCE(a.paid,0) AS amount_paid,
            ch.amount-ch.discount-COALESCE(a.paid,0) AS balance,ch.due_on AS due_date,
            CASE WHEN ch.amount-ch.discount<=COALESCE(a.paid,0) THEN 'paid' WHEN COALESCE(a.paid,0)>0 THEN 'partially_paid' ELSE 'unpaid' END AS status,
            ch.due_on<CURRENT_DATE AND ch.amount-ch.discount>COALESCE(a.paid,0) AS overdue
          FROM public.student_charges ch JOIN public.fee_campaigns f ON f.id=ch.campaign_id AND f.school_id=@school
          JOIN public.students st ON st.id=ch.student_id AND st.school_id=@school
          JOIN public.fee_types ft ON ft.id=ch.fee_type_id AND ft.school_id=@school
          LEFT JOIN tv4.campaign_details d ON d.campaign_id=f.id
          LEFT JOIN tv4.charge_details cd ON cd.charge_id=ch.id AND cd.school_id=@school
          LEFT JOIN LATERAL(SELECT cl.* FROM public.class_enrollments e JOIN public.classes cl ON cl.id=e.class_id AND cl.school_id=@school AND cl.academic_year_id=f.academic_year_id WHERE e.student_id=st.id ORDER BY (cl.id=cd.class_id) DESC,(e.status='active') DESC,e.enrolled_on DESC LIMIT 1)c ON true
          LEFT JOIN LATERAL(SELECT sum(pa.amount) AS paid FROM public.payment_allocations pa JOIN public.payments p ON p.id=pa.payment_id AND p.school_id=@school AND p.status IN ('verified','refunded') WHERE pa.charge_id=ch.id)a ON true
        )q WHERE (@campaign::uuid IS NULL OR campaign_id=@campaign) AND (@student::uuid IS NULL OR student_id=@student)
          AND (@class::uuid IS NULL OR class_id=@class) AND (@grade::uuid IS NULL OR grade_level_id=@grade)
          AND (@year::uuid IS NULL OR academic_year_id=@year) AND (@semester::uuid IS NULL OR semester_id=@semester)
          AND (@status::text IS NULL OR status=@status) AND (@overdue::boolean IS NULL OR overdue=@overdue)
          AND (@charge::uuid IS NULL OR id=@charge)
        """;
    private static async Task<List<Tv4Row>> ChargeRows(Tv4Session s, ChargeQuery q, Guid? chargeId = null)
    {
        if (q.Status is not null) Choice(q.Status, "unpaid", "partially_paid", "paid");
        return await s.Query(ChargeSql + " ORDER BY student_code,fee_name", ("campaign", q.CampaignId), ("student", q.StudentId), ("class", q.ClassId), ("grade", q.GradeLevelId), ("year", q.AcademicYearId), ("semester", q.SemesterId), ("status", q.Status), ("overdue", q.Overdue), ("charge", chargeId));
    }
    private static async Task<Tv4Row> Charge(Tv4Session s, Guid id)
    {
        await s.One("SELECT c.id FROM public.student_charges c JOIN public.fee_campaigns f ON f.id=c.campaign_id JOIN public.students st ON st.id=c.student_id WHERE c.id=@id AND f.school_id=@school AND st.school_id=@school FOR UPDATE OF c", ("id", id));
        return (await ChargeRows(s, new ChargeQuery(), id)).Single();
    }
    public Task<object> Charges(ChargeQuery query, bool debtsOnly, CancellationToken ct) => _store.Run<object>(false, async s => (await ChargeRows(s, query)).Where(r => !debtsOnly || r.Get<decimal>("balance") > 0).ToList(), ct);
    public Task<object> Exemptions(Guid chargeId, ExemptionInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        var charge = input is null ? (await ChargeRows(s, new ChargeQuery(), chargeId)).SingleOrDefault() ?? throw new KeyNotFoundException("Charge was not found.") : await Charge(s, chargeId);
        if (input is not null)
        {
            Money(input.Amount); Required(input.Reason, "Reason");
            if (input.Amount > charge.Get<decimal>("balance")) throw new InvalidOperationException("Discount exceeds unpaid balance.");
            var id = Guid.NewGuid(); var workflow = await s.SubmitWorkflow("other", "Miễn giảm khoản thu", input.Reason, charge.Get<Guid>("student_id"));
            await s.Execute("INSERT INTO tv4.exemptions(id,school_id,charge_id,amount,reason,workflow_id) VALUES(@id,@school,@charge,@amount,@reason,@workflow)", ("id", id), ("charge", chargeId), ("amount", input.Amount), ("reason", input.Reason.Trim()), ("workflow", workflow));
            await s.Audit("student_charges", chargeId, "exemption_requested", null, new { id, workflow, input.Amount });
        }
        return await s.Query("SELECT e.*,w.status,w.requester_id,w.decided_at FROM tv4.exemptions e JOIN public.workflow_requests w ON w.id=e.workflow_id AND w.school_id=@school WHERE e.charge_id=@charge AND e.school_id=@school ORDER BY w.created_at DESC", ("charge", chargeId));
    }, ct);
    public Task<object> DecideExemption(Guid id, DecisionInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        var e = await s.One("SELECT * FROM tv4.exemptions WHERE id=@id AND school_id=@school FOR UPDATE", ("id", id));
        var charge = await Charge(s, e.Get<Guid>("charge_id"));
        if (input.Decision == "approved" && e.Get<decimal>("amount") > charge.Get<decimal>("balance")) throw new InvalidOperationException("Discount exceeds unpaid balance.");
        await s.DecideWorkflow(e.Get<Guid>("workflow_id"), input, "workflow.approve");
        if (input.Decision == "approved") await s.Execute("UPDATE public.student_charges SET discount=discount+@amount WHERE id=@id", ("amount", e.Get<decimal>("amount")), ("id", e.Get<Guid>("charge_id")));
        await s.Audit("student_charges", e.Get<Guid>("charge_id"), "exemption_" + input.Decision, charge, e);
        return await Charge(s, e.Get<Guid>("charge_id"));
    }, ct);
    public Task<object> Notices(Guid campaignId, NoticeInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        await Campaign(s, campaignId);
        if (input is not null)
        {
            var id = Guid.NewGuid(); await s.Execute("INSERT INTO tv4.notices(id,school_id,campaign_id,title,message,created_by) VALUES(@id,@school,@campaign,@title,@message,@actor)", ("id", id), ("campaign", campaignId), ("title", Required(input.Title, "Title")), ("message", Required(input.Message, "Message")));
            await s.Audit("tv4.notices", id, "created", null, input);
        }
        return await s.Query("SELECT * FROM tv4.notices WHERE campaign_id=@id AND school_id=@school ORDER BY created_at DESC", ("id", campaignId));
    }, ct);
    private static async Task<object> Delivery(Tv4Session s, Guid key, Guid? notice, Guid? charge, Guid campaign, string title, string message)
    {
        var batch = await s.Query("SELECT id,notice_id,charge_id FROM tv4.delivery_batches WHERE school_id=@school AND request_key=@key FOR UPDATE", ("key", key));
        if (batch.Count != 0 && (batch[0].Optional<Guid>("notice_id") != notice || batch[0].Optional<Guid>("charge_id") != charge)) throw new InvalidOperationException("RequestKey already belongs to another delivery.");
        if (batch.Count != 0)
        {
            var old = await s.Query("SELECT notification_id FROM tv4.deliveries WHERE school_id=@school AND request_key=@key ORDER BY notification_id", ("key", key));
            return new { RecipientCount = old.Count, NotificationIds = old.Select(r => r.Get<Guid>("notification_id")).ToArray() };
        }
        await s.Execute("INSERT INTO tv4.delivery_batches(id,school_id,request_key,notice_id,charge_id) VALUES(@id,@school,@key,@notice,@charge)", ("id", Guid.NewGuid()), ("key", key), ("notice", notice), ("charge", charge));
        var recipients = await s.Query("SELECT DISTINCT g.user_id FROM public.student_charges c JOIN public.students st ON st.id=c.student_id AND st.school_id=@school JOIN public.student_guardians sg ON sg.student_id=st.id AND sg.can_view_finance AND sg.verified_at IS NOT NULL JOIN public.guardians g ON g.id=sg.guardian_id AND g.school_id=@school JOIN public.profiles p ON p.id=g.user_id AND p.status='active' WHERE c.campaign_id=@campaign AND (@charge::uuid IS NULL OR c.id=@charge) AND EXISTS(SELECT 1 FROM public.school_memberships m WHERE m.user_id=g.user_id AND m.school_id=@school AND m.status='active' AND (m.valid_from IS NULL OR m.valid_from<=CURRENT_DATE) AND (m.valid_to IS NULL OR m.valid_to>=CURRENT_DATE))", ("campaign", campaign), ("charge", charge));
        var ids = new List<Guid>();
        foreach (var recipient in recipients)
        {
            var notification = Guid.NewGuid(); ids.Add(notification);
            await s.Execute("INSERT INTO public.notifications(id,user_id,title,message,kind,payload) VALUES(@id,@user,@title,@message,'finance',@payload::jsonb); INSERT INTO tv4.deliveries(id,school_id,notice_id,charge_id,request_key,recipient_id,notification_id) VALUES(@delivery,@school,@notice,@charge,@key,@user,@id)", ("id", notification), ("user", recipient.Get<Guid>("user_id")), ("title", title), ("message", message), ("payload", JsonSerializer.Serialize(new { schoolId = s.SchoolId, campaignId = campaign, chargeId = charge, noticeId = notice })), ("delivery", Guid.NewGuid()), ("notice", notice), ("charge", charge), ("key", key));
        }
        return new { RecipientCount = ids.Count, NotificationIds = ids };
    }
    public Task<object> SendNotice(Guid id, CancellationToken ct) => _store.Run(true, async s =>
    {
        var n = await s.One("SELECT * FROM tv4.notices WHERE id=@id AND school_id=@school FOR UPDATE", ("id", id));
        await Campaign(s, n.Get<Guid>("campaign_id"));
        var result = await Delivery(s, id, id, null, n.Get<Guid>("campaign_id"), n.Get<string>("title"), n.Get<string>("message"));
        await s.Execute("UPDATE tv4.notices SET sent_at=COALESCE(sent_at,now()) WHERE id=@id AND school_id=@school", ("id", id));
        await s.Audit("tv4.notices", id, "sent", null, result); return result;
    }, ct);
    public Task<object> Reminder(Guid chargeId, ReminderInput input, CancellationToken ct) => _store.Run(true, async s =>
    {
        Choice(input.Channel, "in_app"); if (input.RequestKey == Guid.Empty) throw new ArgumentException("RequestKey is required.");
        var charge = await Charge(s, chargeId); if (charge.Get<decimal>("balance") <= 0) throw new InvalidOperationException("This charge has no outstanding balance.");
        if (await s.Exists("SELECT 1 FROM tv4.delivery_batches WHERE school_id=@school AND request_key=@key AND charge_id IS DISTINCT FROM @charge", ("key", input.RequestKey), ("charge", chargeId))) throw new InvalidOperationException("RequestKey already belongs to another delivery.");
        var result = await Delivery(s, input.RequestKey, null, chargeId, charge.Get<Guid>("campaign_id"), "Nhắc nộp khoản thu", Optional(input.Message) ?? $"{charge.Text("fee_name")}: còn phải nộp {charge.Get<decimal>("balance"):N0} VND.");
        await s.Audit("student_charges", chargeId, "reminder", null, result); return result;
    }, ct);
    private static Task<Tv4Row> Payment(Tv4Session s, Guid id, bool locked = false) => s.One("SELECT p.* FROM public.payments p JOIN public.students st ON st.id=p.student_id AND st.school_id=@school WHERE p.id=@id AND p.school_id=@school" + (locked ? " FOR UPDATE OF p" : ""), ("id", id));
    public Task<object> Payments(Guid? studentId, string? status, CancellationToken ct) => _store.Run<object>(false, async s =>
    {
        if (status is not null) Choice(status, "pending", "verified", "rejected", "refunded");
        return await s.Query("SELECT p.*,st.full_name AS student_name,st.student_code,c.name AS class_name,c.id AS class_id,rec.full_name AS recorded_by_name,ver.full_name AS verified_by_name,COALESCE((SELECT jsonb_agg(jsonb_build_object('chargeId',a.charge_id,'amount',a.amount)) FROM public.payment_allocations a WHERE a.payment_id=p.id),'[]'::jsonb) AS allocations,COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a.id,'type',a.adjustment_type,'amount',a.amount,'approvedBy',a.approved_by)) FROM public.payment_adjustments a WHERE a.payment_id=p.id),'[]'::jsonb) AS adjustments,COALESCE((SELECT jsonb_agg(jsonb_build_object('actorId',h.actor_id,'action',h.operation,'at',h.occurred_at) ORDER BY h.occurred_at,h.id) FROM public.audit_logs h WHERE h.school_id=@school AND h.table_name='payments' AND h.row_id=p.id::text),'[]'::jsonb) AS history FROM public.payments p JOIN public.students st ON st.id=p.student_id AND st.school_id=@school LEFT JOIN public.profiles rec ON rec.id=p.recorded_by LEFT JOIN public.profiles ver ON ver.id=p.verified_by LEFT JOIN LATERAL (SELECT cl.* FROM public.class_enrollments e JOIN public.classes cl ON cl.id=e.class_id AND cl.school_id=@school WHERE e.student_id=st.id ORDER BY (e.status='active') DESC,e.enrolled_on DESC LIMIT 1)c ON true WHERE p.school_id=@school AND (@student::uuid IS NULL OR p.student_id=@student) AND (@status::text IS NULL OR p.status=@status) ORDER BY p.paid_at DESC", ("student", studentId), ("status", status));
    }, ct);
    public Task<object> RecordPayment(RecordPaymentInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        Money(input.Amount); Choice(input.PaymentMethod, "cash", "bank_transfer", "gateway");
        await s.One("SELECT id FROM public.students WHERE id=@id AND school_id=@school", ("id", input.StudentId));
        if (input.Allocations is null || input.Allocations.Count == 0 || input.Allocations.Any(a => a is null) || input.Allocations.Select(a => a.ChargeId).Distinct().Count() != input.Allocations.Count || input.Allocations.Sum(a => a.Amount) != input.Amount) throw new ArgumentException("Unique allocations must sum to payment amount.");
        foreach (var a in input.Allocations)
        {
            Money(a.Amount); var charge = await Charge(s, a.ChargeId);
            if (charge.Get<Guid>("student_id") != input.StudentId) throw new ArgumentException("Allocation belongs to another student.");
            if (a.Amount > charge.Get<decimal>("balance")) throw new InvalidOperationException("Allocation exceeds outstanding balance.");
        }
        var id = Guid.NewGuid();
        await s.Execute("INSERT INTO public.payments(id,school_id,student_id,amount,method,external_reference,paid_at,status,recorded_by) VALUES(@id,@school,@student,@amount,@method,@reference,@paid,'pending',@actor)", ("id", id), ("student", input.StudentId), ("amount", input.Amount), ("method", input.PaymentMethod), ("reference", "TV4-" + id.ToString("N")), ("paid", input.PaidAt?.ToUniversalTime() ?? DateTimeOffset.UtcNow));
        foreach (var a in input.Allocations) await s.Execute("INSERT INTO tv4.payment_intents(payment_id,charge_id,amount) VALUES(@payment,@charge,@amount)", ("payment", id), ("charge", a.ChargeId), ("amount", a.Amount));
        await s.Audit("payments", id, "recorded", null, input); return await Payment(s, id);
    }, ct);
    private static async Task<Tv4Row> VerifyPayment(Tv4Session s, Guid id, DecisionInput input)
    {
        Choice(input.Decision, "verified", "rejected"); var p = await Payment(s, id, true);
        if (p.Text("status") == input.Decision) return p;
        if (p.Text("status") != "pending") throw new InvalidOperationException("Only pending payments can be verified or rejected.");
        if (input.Decision == "verified")
        {
            var intents = await s.Query("SELECT charge_id,amount FROM tv4.payment_intents WHERE payment_id=@id ORDER BY charge_id", ("id", id));
            if (intents.Count == 0 || intents.Sum(a => a.Get<decimal>("amount")) != p.Get<decimal>("amount")) throw new InvalidOperationException("Payment has no valid allocation instructions.");
            foreach (var a in intents)
            {
                var charge = await Charge(s, a.Get<Guid>("charge_id"));
                if (charge.Get<Guid>("student_id") != p.Get<Guid>("student_id") || a.Get<decimal>("amount") > charge.Get<decimal>("balance")) throw new InvalidOperationException("Payment allocation exceeds this student's outstanding balance.");
                await s.Execute("INSERT INTO public.payment_allocations(payment_id,charge_id,amount) VALUES(@payment,@charge,@amount)", ("payment", id), ("charge", a.Get<Guid>("charge_id")), ("amount", a.Get<decimal>("amount")));
            }
        }
        await s.Execute("UPDATE public.payments SET status=@status,verified_by=@actor,verified_at=now() WHERE id=@id AND school_id=@school", ("status", input.Decision), ("id", id));
        await s.Audit("payments", id, input.Decision, p, input); return await Payment(s, id);
    }
    public Task<object> Verify(Guid id, DecisionInput input, CancellationToken ct) => _store.Run<object>(true, s => VerifyAsObject(s, id, input), ct);
    private static async Task<object> VerifyAsObject(Tv4Session s, Guid id, DecisionInput input) => await VerifyPayment(s, id, input);
    public Task<object> BankTransactions(string? status, CancellationToken ct) => _store.Run<object>(false, async s =>
    {
        if (status is not null) Choice(status, "unmatched", "reconciled");
        return await s.Query("SELECT * FROM tv4.bank_transactions WHERE school_id=@school AND (@status::text IS NULL OR (@status='unmatched' AND payment_id IS NULL) OR (@status='reconciled' AND payment_id IS NOT NULL)) ORDER BY transaction_at DESC", ("status", status));
    }, ct);
    public Task<object> Import(BankImportInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        var source = Required(input.Source, "Source").ToUpperInvariant(); ArgumentNullException.ThrowIfNull(input.Transactions); var imported = 0; var duplicates = 0;
        foreach (var t in input.Transactions)
        {
            ArgumentNullException.ThrowIfNull(t);
            Money(t.Amount); Required(t.TransactionId, "TransactionId"); Required(t.Reference, "Reference"); if (t.TransactionAt == default) throw new ArgumentException("TransactionAt is required.");
            var id = Guid.NewGuid(); var count = await s.Execute("INSERT INTO tv4.bank_transactions(id,school_id,source,transaction_id,reference,amount,transaction_at,description,imported_by) VALUES(@id,@school,@source,@transaction,@reference,@amount,@time,@description,@actor) ON CONFLICT(school_id,source,transaction_id) DO NOTHING", ("id", id), ("source", source), ("transaction", t.TransactionId.Trim()), ("reference", t.Reference.Trim()), ("amount", t.Amount), ("time", t.TransactionAt.ToUniversalTime()), ("description", Optional(t.Description)));
            if (count == 0) duplicates++; else { imported++; await s.Audit("tv4.bank_transactions", id, "imported", null, t); }
        }
        return new { ImportedCount = imported, DuplicateCount = duplicates };
    }, ct);
    public Task<object> Reconcile(ReconcileInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        ArgumentNullException.ThrowIfNull(input.Matches); if (input.Matches.Any(m => m is null) || input.Matches.Select(m => m.PaymentId).Distinct().Count() != input.Matches.Count || input.Matches.Select(m => m.BankTransactionId).Distinct().Count() != input.Matches.Count) throw new ArgumentException("Duplicate or null bank/payment match.");
        foreach (var m in input.Matches)
        {
            var bank = await s.One("SELECT * FROM tv4.bank_transactions WHERE id=@id AND school_id=@school FOR UPDATE", ("id", m.BankTransactionId)); var payment = await Payment(s, m.PaymentId, true);
            if (bank.Optional<Guid>("payment_id") == m.PaymentId) continue;
            if (bank.Optional<Guid>("payment_id").HasValue || await s.Exists("SELECT 1 FROM tv4.bank_transactions WHERE payment_id=@id", ("id", m.PaymentId))) throw new InvalidOperationException("Bank transaction or payment already reconciled.");
            if (bank.Get<decimal>("amount") != payment.Get<decimal>("amount") || payment.Text("method") != "bank_transfer" || bank.Text("reference") != payment.Text("external_reference")) throw new InvalidOperationException("Bank amount, reference and payment method must match.");
            if (payment.Text("status") == "pending") await VerifyPayment(s, m.PaymentId, new DecisionInput("verified", "Bank reconciliation"));
            else if (payment.Text("status") != "verified") throw new InvalidOperationException("Only pending or verified payments can reconcile.");
            await s.Execute("UPDATE tv4.bank_transactions SET payment_id=@payment,reconciled_at=now() WHERE id=@id AND school_id=@school", ("payment", m.PaymentId), ("id", m.BankTransactionId)); await s.Audit("payments", m.PaymentId, "reconciled", null, m);
        }
        return new { MatchedCount = input.Matches.Count };
    }, ct);
    public Task<object> Adjustments(AdjustmentInput? input, CancellationToken ct) => _store.Run<object>(input is not null, async s =>
    {
        if (input is not null)
        {
            Money(input.Amount); Choice(input.Type, "refund", "correction"); Required(input.Reason, "Reason"); var p = await Payment(s, input.PaymentId, true);
            if (p.Text("status") != "verified") throw new InvalidOperationException("Only verified payments can be adjusted.");
            var reserved = await s.One("SELECT COALESCE(sum(a.amount),0) AS amount FROM tv4.adjustments a JOIN public.workflow_requests w ON w.id=a.workflow_id WHERE a.payment_id=@id AND w.status NOT IN ('rejected','cancelled')", ("id", input.PaymentId));
            var external = await s.One("SELECT COALESCE(sum(a.amount),0) AS amount FROM public.payment_adjustments a WHERE a.payment_id=@id AND NOT EXISTS(SELECT 1 FROM tv4.adjustments t WHERE t.canonical_adjustment_id=a.id)", ("id", input.PaymentId));
            if (input.Amount > p.Get<decimal>("amount") - reserved.Get<decimal>("amount") - external.Get<decimal>("amount")) throw new InvalidOperationException("Adjustment exceeds remaining refundable amount.");
            var id = Guid.NewGuid(); var workflow = await s.SubmitWorkflow("other", "Điều chỉnh khoản thu", input.Reason, p.Get<Guid>("student_id"));
            await s.Execute("INSERT INTO tv4.adjustments(id,school_id,payment_id,type,amount,reason,workflow_id) VALUES(@id,@school,@payment,@type,@amount,@reason,@workflow)", ("id", id), ("payment", input.PaymentId), ("type", input.Type), ("amount", input.Amount), ("reason", input.Reason.Trim()), ("workflow", workflow)); await s.Audit("tv4.adjustments", id, "requested", null, input);
        }
        return await s.Query("SELECT a.*,w.status,w.requester_id,w.decided_at,COALESCE((SELECT jsonb_agg(jsonb_build_object('actorId',e.actor_id,'action',e.event_type,'status',e.new_status,'note',e.note,'at',e.created_at) ORDER BY e.created_at) FROM public.workflow_events e WHERE e.request_id=w.id),'[]'::jsonb) AS history FROM tv4.adjustments a JOIN public.workflow_requests w ON w.id=a.workflow_id AND w.school_id=@school WHERE a.school_id=@school ORDER BY w.created_at DESC");
    }, ct);
    public Task<object> DecideAdjustment(Guid id, DecisionInput input, CancellationToken ct) => _store.Run<object>(true, async s =>
    { var a = await s.One("SELECT * FROM tv4.adjustments WHERE id=@id AND school_id=@school FOR UPDATE", ("id", id)); await Payment(s, a.Get<Guid>("payment_id")); await s.DecideWorkflow(a.Get<Guid>("workflow_id"), input, "workflow.approve"); await s.Audit("tv4.adjustments", id, "decision", null, input); return new { id, Status = input.Decision }; }, ct);
    public Task<object> ExecuteAdjustment(Guid id, CancellationToken ct) => _store.Run<object>(true, async s =>
    {
        var a = await s.One("SELECT a.*,w.status,w.requester_id FROM tv4.adjustments a JOIN public.workflow_requests w ON w.id=a.workflow_id AND w.school_id=@school WHERE a.id=@id AND a.school_id=@school FOR UPDATE OF a,w", ("id", id));
        if (a.Optional<DateTime>("executed_at").HasValue) return a;
        if (a.Text("status") != "approved") throw new InvalidOperationException("An approved workflow is required.");
        var p = await Payment(s, a.Get<Guid>("payment_id"), true); if (p.Text("status") != "verified") throw new InvalidOperationException("Payment is no longer refundable.");
        var allocations = await s.Query("SELECT charge_id,amount FROM public.payment_allocations WHERE payment_id=@id ORDER BY charge_id FOR UPDATE", ("id", p.Get<Guid>("id")));
        var amount = a.Get<decimal>("amount"); if (amount > allocations.Sum(r => r.Get<decimal>("amount"))) throw new InvalidOperationException("Adjustment exceeds allocated refundable amount.");
        var remaining = amount;
        foreach (var allocation in allocations)
        {
            if (remaining <= 0) break; var take = Math.Min(remaining, allocation.Get<decimal>("amount")); var chargeId = allocation.Get<Guid>("charge_id"); await Charge(s, chargeId);
            if (take == allocation.Get<decimal>("amount")) await s.Execute("DELETE FROM public.payment_allocations WHERE payment_id=@payment AND charge_id=@charge", ("payment", p.Get<Guid>("id")), ("charge", chargeId));
            else await s.Execute("UPDATE public.payment_allocations SET amount=amount-@amount WHERE payment_id=@payment AND charge_id=@charge", ("amount", take), ("payment", p.Get<Guid>("id")), ("charge", chargeId));
            await s.Execute("INSERT INTO tv4.adjustment_allocations(adjustment_id,charge_id,amount) VALUES(@id,@charge,@amount)", ("id", id), ("charge", chargeId), ("amount", take)); remaining -= take;
        }
        var canonical = Guid.NewGuid(); var approver = await s.One("SELECT acted_by FROM public.approval_steps WHERE request_id=@workflow AND status='approved' ORDER BY step_no DESC LIMIT 1", ("workflow", a.Get<Guid>("workflow_id")));
        if (approver.Get<Guid>("acted_by") == a.Get<Guid>("requester_id")) throw new Tv4ForbiddenException("Requester approval is invalid.");
        await s.Execute("INSERT INTO public.payment_adjustments(id,payment_id,adjustment_type,amount,reason,approved_by) VALUES(@canonical,@payment,@type,@amount,@reason,@approved); UPDATE tv4.adjustments SET executed_at=now(),executed_by=@actor,canonical_adjustment_id=@canonical WHERE id=@id AND school_id=@school; UPDATE public.workflow_requests SET status='completed',updated_at=now() WHERE id=@workflow AND school_id=@school; INSERT INTO public.workflow_events(id,request_id,actor_id,event_type,old_status,new_status) VALUES(@event,@workflow,@actor,'executed','approved','completed')", ("canonical", canonical), ("payment", p.Get<Guid>("id")), ("type", a.Text("type")), ("amount", amount), ("reason", a.Text("reason")), ("approved", approver.Get<Guid>("acted_by")), ("id", id), ("workflow", a.Get<Guid>("workflow_id")), ("event", Guid.NewGuid()));
        if (allocations.Sum(r => r.Get<decimal>("amount")) == amount) await s.Execute("UPDATE public.payments SET status='refunded' WHERE id=@id AND school_id=@school", ("id", p.Get<Guid>("id")));
        await s.Audit("payments", p.Get<Guid>("id"), "adjustment_executed", p, new { id, amount }); return new { id, Status = "completed" };
    }, ct);
    public Task<object> Receipt(Guid id, bool create, CancellationToken ct) => _store.Run<object>(create, async s =>
    {
        if (create)
        {
            var p = await Payment(s, id, true);
            var existing = await s.Query("SELECT * FROM tv4.receipts WHERE payment_id=@id AND school_id=@school", ("id", id));
            if (existing.Count != 0) return existing[0];
            if (p.Text("status") != "verified") throw new InvalidOperationException("A fully refunded payment cannot receive a new receipt.");
            var receipt = Guid.NewGuid(); var student = await s.One("SELECT student_code,full_name FROM public.students WHERE id=@id AND school_id=@school", ("id", p.Get<Guid>("student_id")));
            await s.Execute("INSERT INTO tv4.receipts(id,school_id,payment_id,receipt_code,student_id,amount,issued_by,snapshot) VALUES(@id,@school,@payment,@code,@student,@amount,@actor,@snapshot::jsonb)", ("id", receipt), ("payment", id), ("code", "SOMS-" + receipt.ToString("N").ToUpperInvariant()), ("student", p.Get<Guid>("student_id")), ("amount", p.Get<decimal>("amount")), ("snapshot", JsonSerializer.Serialize(new { StudentName = student.Text("full_name"), StudentCode = student.Text("student_code"), Amount = p.Get<decimal>("amount"), Method = p.Text("method"), PaidAt = p["paid_at"] })));
            await s.Audit("tv4.receipts", receipt, "issued", null, new { PaymentId = id }); return await s.One("SELECT * FROM tv4.receipts WHERE id=@id AND school_id=@school", ("id", receipt));
        }
        return await s.One("SELECT * FROM tv4.receipts WHERE id=@id AND school_id=@school", ("id", id));
    }, ct);
    public async Task<Tv4File> ReceiptFile(Guid id, CancellationToken ct)
    {
        var receipt = (Tv4Row)await Receipt(id, false, ct); var root = receipt.Get<JsonElement>("snapshot");
        return Tv4Export.Create("Biên nhận khoản thu", new[] { "Biên nhận", "Học sinh", "Mã học sinh", "Số tiền (VND)", "Phương thức" }, new[] { new object?[] { receipt.Text("receipt_code"), root.GetProperty("StudentName").GetString(), root.GetProperty("StudentCode").GetString(), receipt.Get<decimal>("amount"), root.GetProperty("Method").GetString() } }, "pdf", "receipt-" + id);
    }
    private sealed record ReportResult(List<Tv4Row> Rows, decimal TotalDue, decimal TotalPaid, decimal TotalDebt);
    private static async Task<ReportResult> Report(Tv4Session s, ChargeQuery query)
    {
        Choice(query.ReportType, "collection", "debt");
        if (query.FromDate > query.ToDate) throw new ArgumentException("Invalid date range.");
        if (query.ReportType == "debt" && (query.FromDate.HasValue || query.ToDate.HasValue))
            throw new ArgumentException("Debt reports show current balances; historical date filters are not valid. Use collection reports for a payment period.");
        var rows = await ChargeRows(s, query);
        if (query.ReportType == "debt") rows = rows.Where(r => r.Get<decimal>("balance") > 0).ToList();
        if (query.FromDate.HasValue || query.ToDate.HasValue)
        {
            var collected = await s.Query("SELECT a.charge_id,sum(a.amount) AS amount FROM public.payment_allocations a JOIN public.payments p ON p.id=a.payment_id WHERE p.school_id=@school AND p.status IN ('verified','refunded') AND (@from::date IS NULL OR p.paid_at>=@from::date) AND (@to::date IS NULL OR p.paid_at<@to::date+1) GROUP BY a.charge_id", ("from", query.FromDate), ("to", query.ToDate));
            var byCharge = collected.ToDictionary(r => r.Get<Guid>("charge_id"), r => r.Get<decimal>("amount"));
            foreach (var row in rows)
            {
                row["all_time_paid"] = row["amount_paid"];
                row["amount_paid"] = byCharge.GetValueOrDefault(row.Get<Guid>("id"));
            }
            rows = rows.Where(r => r.Get<decimal>("amount_paid") > 0).ToList();
        }
        return new(rows, rows.Sum(r => r.Get<decimal>("amount_due")), rows.Sum(r => r.Get<decimal>("amount_paid")), rows.Sum(r => r.Get<decimal>("balance")));
    }
    public Task<object> Reports(ChargeQuery query, CancellationToken ct) => _store.Run<object>(false, async s => await Report(s, query), ct);
    public Task<Tv4File> Export(FinanceExportInput input, CancellationToken ct) => _store.Run(false, async s =>
    {
        ArgumentNullException.ThrowIfNull(input.Filters);
        var report = await Report(s, input.Filters with { ReportType = input.ReportType });
        return Tv4Export.Create(input.ReportType == "debt" ? "Báo cáo công nợ" : "Báo cáo khoản thu", new[] { "Mã HS", "Học sinh", "Lớp", "Khoản thu", "Phải nộp", "Đã nộp", "Còn nợ" }, report.Rows.Select(r => new object?[] { r.Text("student_code"), r.Text("student_name"), r.Text("class_name"), r.Text("fee_name"), r["amount_due"], r["amount_paid"], r["balance"] }).ToArray(), input.Format, "finance-" + input.ReportType);
    }, ct);
}
