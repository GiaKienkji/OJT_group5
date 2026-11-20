using System.IO.Compression;
using System.Text.Json;
using SOMS.Api.Controllers;
using SOMS.Application.Common.Models;
using SOMS.Application.Modules.Finance.DTOs;
using SOMS.Infrastructure.Services;
using Xunit;

namespace SOMS.UnitTests;

[CollectionDefinition("TV4 PostgreSQL", DisableParallelization = true)]
public sealed class Tv4PostgresCollection : ICollectionFixture<Tv4PostgresFixture> { }

[Collection("TV4 PostgreSQL")]
public sealed class FinanceServiceTests
{
    private readonly Tv4PostgresFixture _db;
    private static readonly CancellationToken Ct = CancellationToken.None;
    public FinanceServiceTests(Tv4PostgresFixture db) => _db = db;
    internal static Tv4Row Row(object value) => Assert.IsType<Tv4Row>(value);
    internal static List<Tv4Row> Rows(object value) => Assert.IsType<List<Tv4Row>>(value);
    internal static JsonElement Json(object value)
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new Tv4RowJsonConverter());
        return JsonSerializer.SerializeToElement(value, options);
    }
    internal static async Task<(Guid Campaign, Guid Charge)> SetupCharge(Tv4PostgresFixture db, decimal amount = 100)
    {
        var service = db.Finance();
        var category = Row(await service.Categories(null, new("F" + Guid.NewGuid().ToString("N"), "Học phí", true), Ct));
        var campaign = Row(await service.Campaigns(null, new("Học kỳ thử nghiệm", db.Year, db.Semester, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)), "draft"), Ct));
        await service.Rules(campaign.Get<Guid>("id"), new() { new(category.Get<Guid>("id"), db.Grade, null, amount, null) }, Ct);
        await service.Apply(campaign.Get<Guid>("id"), new(new()), Ct);
        var charge = Assert.Single(Rows(await service.Charges(new(CampaignId: campaign.Get<Guid>("id")), false, Ct)));
        return (campaign.Get<Guid>("id"), charge.Get<Guid>("id"));
    }
    [PostgresFact]
    public async Task Rules_ClassOverridesGrade_AndRepeatedAssignmentDoesNotDuplicate()
    {
        var service = _db.Finance();
        var category = Row(await service.Categories(null, new("F" + Guid.NewGuid().ToString("N"), "Bảo hiểm", true), Ct));
        var campaign = Row(await service.Campaigns(null, new("Ưu tiên lớp", _db.Year, _db.Semester, null, "draft"), Ct));
        var id = campaign.Get<Guid>("id");
        await service.Rules(id, new() { new(category.Get<Guid>("id"), _db.Grade, null, 100, null), new(category.Get<Guid>("id"), null, _db.Class, 80, null) }, Ct);
        await service.Apply(id, new(new()), Ct);
        await service.Apply(id, new(new()), Ct);
        var charge = Assert.Single(Rows(await service.Charges(new(CampaignId: id), false, Ct)));
        Assert.Equal(80m, charge.Get<decimal>("amount_due"));
        Assert.Equal("Nguyễn Ánh", charge.Text("student_name"));
        Assert.Equal("Lớp 10A1", charge.Text("class_name"));
        Assert.Equal(_db.Class, Assert.Single(await _db.Rows("SELECT class_id FROM tv4.charge_details WHERE charge_id=@id", ("id", charge.Get<Guid>("id")))).Get<Guid>("class_id"));
        Assert.Empty(Rows(await _db.Finance(_db.OtherActor, _db.OtherSchool).Charges(new(CampaignId: id), false, Ct)));
    }
    [PostgresFact]
    public async Task PendingPayment_OnlyVerificationAllocates_ReceiptRetryReturnsSameReceipt()
    {
        var (_, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        var payment = Row(await service.RecordPayment(new(_db.Student, 40, "cash", null, new() { new(charge, 40) }), Ct));
        Assert.Equal("pending", payment.Text("status"));
        var before = Rows(await service.Charges(new(StudentId: _db.Student), false, Ct)).Single(r => r.Get<Guid>("id") == charge);
        Assert.Equal(100m, before.Get<decimal>("balance"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Receipt(payment.Get<Guid>("id"), true, Ct));
        await service.Verify(payment.Get<Guid>("id"), new("verified", null), Ct);
        await service.Verify(payment.Get<Guid>("id"), new("verified", null), Ct);
        var after = Rows(await service.Charges(new(StudentId: _db.Student), false, Ct)).Single(r => r.Get<Guid>("id") == charge);
        Assert.Equal(40m, after.Get<decimal>("amount_paid"));
        Assert.Equal(60m, after.Get<decimal>("balance"));
        var receipt = Row(await service.Receipt(payment.Get<Guid>("id"), true, Ct));
        var retry = Row(await service.Receipt(payment.Get<Guid>("id"), true, Ct));
        Assert.Equal(receipt.Get<Guid>("id"), retry.Get<Guid>("id"));
        var pdf = await service.ReceiptFile(receipt.Get<Guid>("id"), Ct);
        Assert.Equal("application/pdf", pdf.ContentType);
        Assert.Equal("%PDF", System.Text.Encoding.ASCII.GetString(pdf.Content, 0, 4));
        var history = Json(await service.Payments(_db.Student, null, Ct));
        Assert.Equal(JsonValueKind.Array, history.EnumerateArray().Single(r => r.GetProperty("id").GetGuid() == payment.Get<Guid>("id")).GetProperty("allocations").ValueKind);
    }
    [PostgresFact]
    public async Task OverpaymentAndCrossSchoolAllocation_AreRejectedWithoutPartialWrites()
    {
        var (_, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RecordPayment(new(_db.Student, 101, "cash", null, new() { new(charge, 101) }), Ct));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.RecordPayment(new(_db.OtherStudent, 10, "cash", null, new() { new(charge, 10) }), Ct));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _db.Finance(_db.OtherActor, _db.OtherSchool).RecordPayment(new(_db.OtherStudent, 10, "cash", null, new() { new(charge, 10) }), Ct));
        Assert.Empty(await _db.Rows("SELECT * FROM tv4.payment_intents WHERE charge_id=@charge", ("charge", charge)));
    }
    [PostgresFact]
    public async Task Refund_RequiresIndependentApproval_ExecutesOnce_ChangesDebtAndNetCollection()
    {
        var (_, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        var payment = Row(await service.RecordPayment(new(_db.Student, 100, "cash", null, new() { new(charge, 100) }), Ct));
        await service.Verify(payment.Get<Guid>("id"), new("verified", null), Ct);
        var adjustments = Rows(await service.Adjustments(new(payment.Get<Guid>("id"), "refund", 30, "Hoàn thu theo phê duyệt"), Ct));
        var adjustment = adjustments.Single(r => r.Get<Guid>("payment_id") == payment.Get<Guid>("id"));
        await Assert.ThrowsAsync<Tv4ForbiddenException>(() => service.DecideAdjustment(adjustment.Get<Guid>("id"), new("approved", null), Ct));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ExecuteAdjustment(adjustment.Get<Guid>("id"), Ct));
        await _db.Finance(_db.Approver).DecideAdjustment(adjustment.Get<Guid>("id"), new("approved", "Đồng ý"), Ct);
        var beforeRefund = Row(await service.Dashboard(Ct));
        await service.ExecuteAdjustment(adjustment.Get<Guid>("id"), Ct);
        await service.ExecuteAdjustment(adjustment.Get<Guid>("id"), Ct);
        var row = Rows(await service.Charges(new(StudentId: _db.Student), false, Ct)).Single(r => r.Get<Guid>("id") == charge);
        Assert.Equal(70m, row.Get<decimal>("amount_paid"));
        Assert.Equal(30m, row.Get<decimal>("balance"));
        var dashboard = Row(await service.Dashboard(Ct));
        Assert.Equal(30m, dashboard.Get<decimal>("outstanding_debt") - beforeRefund.Get<decimal>("outstanding_debt"));
        Assert.Equal(30m, beforeRefund.Get<decimal>("total_collected") - dashboard.Get<decimal>("total_collected"));
        Assert.Single(await _db.Rows("SELECT id FROM public.payment_adjustments WHERE payment_id=@id", ("id", payment.Get<Guid>("id"))));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Adjustments(new(payment.Get<Guid>("id"), "refund", 71, "Too much"), Ct));
    }
    [PostgresFact]
    public async Task FullyRefundedPayment_CannotIssueFirstReceipt_ButKeepsPreviousSnapshot()
    {
        var (_, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        var payment = Row(await service.RecordPayment(new(_db.Student, 100, "cash", null, new() { new(charge, 100) }), Ct));
        var paymentId = payment.Get<Guid>("id");
        await service.Verify(paymentId, new("verified", null), Ct);
        var receipt = Row(await service.Receipt(paymentId, true, Ct));
        var request = Rows(await service.Adjustments(new(paymentId, "refund", 100, "Đã hoàn toàn bộ"), Ct))
            .Single(r => r.Get<Guid>("payment_id") == paymentId);
        await _db.Finance(_db.Approver).DecideAdjustment(request.Get<Guid>("id"), new("approved", null), Ct);
        await service.ExecuteAdjustment(request.Get<Guid>("id"), Ct);
        Assert.Equal("refunded", Assert.Single(await _db.Rows("SELECT status FROM public.payments WHERE id=@id", ("id", paymentId))).Text("status"));
        Assert.Equal(receipt.Get<Guid>("id"), Row(await service.Receipt(paymentId, true, Ct)).Get<Guid>("id"));
        var other = Row(await service.RecordPayment(new(_db.Student, 5, "cash", null, new() { new(charge, 5) }), Ct));
        await service.Verify(other.Get<Guid>("id"), new("verified", null), Ct);
        var noReceipt = Rows(await service.Adjustments(new(other.Get<Guid>("id"), "refund", 5, "Trả ngay"), Ct))
            .Single(r => r.Get<Guid>("payment_id") == other.Get<Guid>("id"));
        await _db.Finance(_db.Approver).DecideAdjustment(noReceipt.Get<Guid>("id"), new("approved", null), Ct);
        await service.ExecuteAdjustment(noReceipt.Get<Guid>("id"), Ct);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Receipt(other.Get<Guid>("id"), true, Ct));
    }

    [PostgresFact]
    public async Task ApprovedExemption_WithinUnpaidBounds_AndReplayCannotDiscountTwice()
    {
        var (_, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        var exemption = Assert.Single(Rows(await service.Exemptions(charge, new(25, "Chính sách miễn giảm"), Ct)));
        await Assert.ThrowsAsync<Tv4ForbiddenException>(() => service.DecideExemption(exemption.Get<Guid>("id"), new("approved", null), Ct));
        await _db.Finance(_db.Approver).DecideExemption(exemption.Get<Guid>("id"), new("approved", null), Ct);
        await Assert.ThrowsAsync<InvalidOperationException>(() => _db.Finance(_db.Approver).DecideExemption(exemption.Get<Guid>("id"), new("approved", null), Ct));
        var row = Rows(await service.Charges(new(StudentId: _db.Student), false, Ct)).Single(r => r.Get<Guid>("id") == charge);
        Assert.Equal(75m, row.Get<decimal>("balance"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Exemptions(charge, new(76, "Too much"), Ct));
    }
    [PostgresFact]
    public async Task NoticesAndReminders_PersistOnlyVerifiedGuardians_AndRetryDeduplicates()
    {
        var (campaign, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        var notice = Assert.Single(Rows(await service.Notices(campaign, new("Thông báo thu", "Nội dung thật"), Ct)));
        var first = Json(await service.SendNotice(notice.Get<Guid>("id"), Ct));
        var retry = Json(await service.SendNotice(notice.Get<Guid>("id"), Ct));
        Assert.Equal(1, first.GetProperty("recipientCount").GetInt32());
        Assert.Equal(first.GetProperty("notificationIds").ToString(), retry.GetProperty("notificationIds").ToString());
        var key = Guid.NewGuid();
        await service.Reminder(charge, new("in_app", null, key), Ct);
        await service.Reminder(charge, new("in_app", null, key), Ct);
        Assert.Single(await _db.Rows("SELECT id FROM tv4.deliveries WHERE request_key=@key", ("key", key)));
        await _db.Sql("UPDATE public.student_guardians SET can_view_finance=false WHERE student_id=@id", ("id", _db.Student));
        try
        {
            var emptyKey = Guid.NewGuid();
            var empty = Json(await service.Reminder(charge, new("in_app", null, emptyKey), Ct));
            Assert.Equal(0, empty.GetProperty("recipientCount").GetInt32());
            await _db.Sql("UPDATE public.student_guardians SET can_view_finance=true WHERE student_id=@id", ("id", _db.Student));
            var replay = Json(await service.Reminder(charge, new("in_app", null, emptyKey), Ct));
            Assert.Equal(0, replay.GetProperty("recipientCount").GetInt32());
        }
        finally { await _db.Sql("UPDATE public.student_guardians SET can_view_finance=true WHERE student_id=@id", ("id", _db.Student)); }
    }
    [PostgresFact]
    public async Task BankImport_IsSourceScoped_AndReconciliationAllocatesOnce()
    {
        var (_, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        var payment = Row(await service.RecordPayment(new(_db.Student, 20, "bank_transfer", null, new() { new(charge, 20) }), Ct));
        var source = Guid.NewGuid().ToString("N");
        var item = new BankTransactionInput("same-id", payment.Get<string>("external_reference"), 20, DateTimeOffset.UtcNow, null);
        await service.Import(new(source, new() { item }), Ct);
        Assert.Equal(1, Json(await service.Import(new(source, new() { item }), Ct)).GetProperty("duplicateCount").GetInt32());
        await service.Import(new(source + "B", new() { item }), Ct);
        var bank = Rows(await service.BankTransactions("unmatched", Ct)).Single(r => r.Text("source") == source.ToUpperInvariant());
        await service.Reconcile(new(new() { new(bank.Get<Guid>("id"), payment.Get<Guid>("id")) }), Ct);
        await service.Reconcile(new(new() { new(bank.Get<Guid>("id"), payment.Get<Guid>("id")) }), Ct);
        Assert.Equal(20m, Assert.Single(await _db.Rows("SELECT amount FROM public.payment_allocations WHERE payment_id=@id", ("id", payment.Get<Guid>("id")))).Get<decimal>("amount"));
    }
    [PostgresFact]
    public async Task CollectionPeriod_ApiAndExportsShareRowsAndTotals_DebtRejectsHistoricalFilters()
    {
        var (campaign, charge) = await SetupCharge(_db);
        var service = _db.Finance();
        foreach (var pair in new[] { (Amount: 30m, Date: new DateTimeOffset(2026, 1, 10, 12, 0, 0, TimeSpan.Zero)), (Amount: 20m, Date: new DateTimeOffset(2026, 2, 10, 12, 0, 0, TimeSpan.Zero)) })
        {
            var payment = Row(await service.RecordPayment(new(_db.Student, pair.Amount, "cash", pair.Date, new() { new(charge, pair.Amount) }), Ct));
            await service.Verify(payment.Get<Guid>("id"), new("verified", null), Ct);
        }
        var query = new ChargeQuery(CampaignId: campaign, FromDate: new(2026, 2, 1), ToDate: new(2026, 2, 28));
        var report = Json(await service.Reports(query, Ct));
        Assert.Equal(20m, report.GetProperty("totalPaid").GetDecimal());
        var xlsx = await service.Export(new("collection", "xlsx", query), Ct);
        using var zip = new ZipArchive(new MemoryStream(xlsx.Content));
        using var reader = new StreamReader(zip.GetEntry("xl/worksheets/sheet1.xml")!.Open());
        var xml = await reader.ReadToEndAsync();
        Assert.Contains("Nguyễn Ánh", xml);
        var sheet = System.Xml.Linq.XDocument.Parse(xml);
        var values = sheet.Descendants(System.Xml.Linq.XName.Get("v", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")).Select(v => decimal.Parse(v.Value, System.Globalization.CultureInfo.InvariantCulture));
        Assert.Contains(20m, values);
        var pdf = await service.Export(new("collection", "pdf", query), Ct);
        using var parsedPdf = PdfSharp.Pdf.IO.PdfReader.Open(new MemoryStream(pdf.Content), PdfSharp.Pdf.IO.PdfDocumentOpenMode.Import);
        Assert.Equal("Báo cáo khoản thu", parsedPdf.Info.Title);
        Assert.NotEmpty(parsedPdf.Pages);
        var artifacts = Environment.GetEnvironmentVariable("SOMS_TV4_ARTIFACT_DIR");
        if (!string.IsNullOrWhiteSpace(artifacts))
        {
            Directory.CreateDirectory(artifacts);
            await File.WriteAllBytesAsync(Path.Combine(artifacts, "finance-period.xlsx"), xlsx.Content);
            await File.WriteAllBytesAsync(Path.Combine(artifacts, "finance-period.pdf"), pdf.Content);
        }
        await Assert.ThrowsAsync<ArgumentException>(() => service.Reports(query with { ReportType = "debt" }, Ct));
    }
}
