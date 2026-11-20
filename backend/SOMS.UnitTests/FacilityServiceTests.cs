using SOMS.Application.Common.Models;
using SOMS.Application.Modules.Facility.DTOs;
using SOMS.Infrastructure.Services;
using Xunit;
using static SOMS.UnitTests.FinanceServiceTests;

namespace SOMS.UnitTests;

[Collection("TV4 PostgreSQL")]
public sealed class FacilityServiceTests
{
    private readonly Tv4PostgresFixture _db;
    private static readonly CancellationToken Ct = CancellationToken.None;
    public FacilityServiceTests(Tv4PostgresFixture db) => _db = db;
    internal static async Task<Guid> SetupAsset(Tv4PostgresFixture db)
    {
        var service = db.Facility();
        var name = "Thiết bị " + Guid.NewGuid().ToString("N");
        await service.Categories(null, new(name), Ct);
        var room = Row(await service.Rooms(null, new("R" + Guid.NewGuid().ToString("N"), "Phòng thử nghiệm", "classroom", 30), Ct));
        var asset = Row(await service.Assets(null, new("A" + Guid.NewGuid().ToString("N"), "Máy chiếu tiếng Việt", name, null, room.Get<Guid>("id"), "working", "Tốt"), new(), Ct));
        return asset.Get<Guid>("id");
    }
    [PostgresFact]
    public async Task RoomAndAssetValidation_RejectsInvalidCapacityAndCrossSchoolForeignKey()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _db.Facility().Rooms(null, new("R", "Phòng", "classroom", 0), Ct));
        var asset = await SetupAsset(_db);
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _db.Facility(_db.OtherActor, _db.OtherSchool).Condition(asset, new("Tốt", "working", null), Ct));
        Assert.NotEmpty(Rows(await _db.Facility().History(asset, Ct)));
    }
    [PostgresFact]
    public async Task Loan_HandoverAndReturnEnforceState_AndAuditActors()
    {
        var asset = await SetupAsset(_db);
        var service = _db.Facility();
        var loans = Rows(await service.Loans(new(asset, "Dạy học", DateTimeOffset.UtcNow.AddDays(2)), Ct));
        var loan = loans.Single(r => r.Get<Guid>("asset_id") == asset);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Return(loan.Get<Guid>("id"), new("Tốt", "working", null), Ct));
        await service.Handover(loan.Get<Guid>("id"), new(null), Ct);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Assign(new(asset, null, null), Ct));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Loans(new(asset, "Trùng", null), Ct));
        await service.Return(loan.Get<Guid>("id"), new("Hỏng bóng đèn", "damaged", "Đã kiểm tra"), Ct);
        var history = await _db.Rows("SELECT operation,actor_id FROM public.audit_logs WHERE table_name='asset_loans' AND row_id=@id ORDER BY occurred_at", ("id", loan.Get<Guid>("id").ToString()));
        Assert.Equal(new[] { "requested", "handed_over", "returned" }, history.Select(r => r.Text("operation")));
        Assert.All(history, r => Assert.Equal(_db.FacilityActor, r.Get<Guid>("actor_id")));
    }
    [PostgresFact]
    public async Task Repair_ResultThenSeparateCompletion_NoProgressBypass()
    {
        var asset = await SetupAsset(_db);
        var service = _db.Facility();
        var incident = Rows(await service.Incidents(new(asset, "Hỏng máy chiếu", "high"), Ct)).Single(r => r.Get<Guid>("asset_id") == asset);
        await service.Severity(incident.Get<Guid>("id"), new("critical"), Ct);
        var job = Rows(await service.Repairs(new(incident.Get<Guid>("id"), "Thay bóng đèn", null), null, Ct)).Single(r => r.Get<Guid>("incident_id") == incident.Get<Guid>("id"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Complete(job.Get<Guid>("id"), Ct));
        await service.Handler(job.Get<Guid>("id"), new(_db.Staff, null), Ct);
        await service.Progress(job.Get<Guid>("id"), new("Đang sửa"), Ct);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.Complete(job.Get<Guid>("id"), Ct));
        await service.Result(job.Get<Guid>("id"), new("Đã sửa", 25000, "Tốt", "working"), Ct);
        await service.Complete(job.Get<Guid>("id"), Ct);
        Assert.Equal("closed", Assert.Single(await _db.Rows("SELECT status FROM public.asset_incidents WHERE id=@id", ("id", incident.Get<Guid>("id")))).Text("status"));
        var history = Rows(await service.Repairs(null, asset, Ct)).Single().Get<List<Tv4Row>>("history");
        Assert.Contains(history, r => r.Text("operation") == "completed" && r.Get<Guid>("actor_id") == _db.FacilityActor);
    }
    [PostgresFact]
    public async Task RecurringMaintenance_CompletionReplayCreatesOnlyOneNextOccurrence()
    {
        var asset = await SetupAsset(_db);
        var service = _db.Facility();
        var jobs = Rows(await service.Maintenance(new(asset, "Bảo trì định kỳ", DateOnly.FromDateTime(DateTime.UtcNow), 3), asset, null, Ct));
        var job = Assert.Single(jobs);
        await service.Handler(job.Get<Guid>("id"), new(_db.Staff, null), Ct);
        await service.MaintenanceResult(job.Get<Guid>("id"), new("Đã vệ sinh", 0, "Tốt", "working"), Ct);
        await service.MaintenanceResult(job.Get<Guid>("id"), new("Đã vệ sinh", 0, "Tốt", "working"), Ct);
        var after = Rows(await service.Maintenance(null, asset, null, Ct));
        Assert.Equal(2, after.Count);
        Assert.Single(after.Where(r => r.Text("status") == "planned"));
        Assert.Single(after.Where(r => r.Text("status") == "done"));
    }
    [PostgresFact]
    public async Task Proposals_RequireReplacementAssetAndIndependentAuthorizedApproval()
    {
        var service = _db.Facility();
        await Assert.ThrowsAsync<ArgumentException>(() => service.Proposals(new("replacement", "Thay", "Hỏng", 1, 0, null), Ct));
        var asset = await SetupAsset(_db);
        var proposal = Rows(await service.Proposals(new("replacement", "Thay máy", "Không sửa được", 1, 500, asset), Ct)).Single(r => r.Optional<Guid>("asset_id") == asset);
        await Assert.ThrowsAsync<Tv4ForbiddenException>(() => service.DecideProposal(proposal.Get<Guid>("id"), new("approved", null), Ct));
        await _db.Facility(_db.Approver).DecideProposal(proposal.Get<Guid>("id"), new("approved", "Đã duyệt"), Ct);
        var after = Rows(await service.Proposals(null, Ct)).Single(r => r.Get<Guid>("id") == proposal.Get<Guid>("id"));
        Assert.Equal("approved", after.Text("status"));
        Assert.Equal(2, after.Get<List<Tv4Row>>("history").Count);
    }
    [PostgresFact]
    public async Task Inventory_PersistsObservedCountAndDiscrepancy_NotAssumedPresence()
    {
        var asset = await SetupAsset(_db);
        var result = Json(await _db.Facility().Inventory(null, new("Kiểm kê thực", new() { new(asset, null, "Không tìm thấy", "lost", false) }), new(), Ct));
        var observation = Assert.Single(result.GetProperty("observations").EnumerateArray());
        Assert.False(observation.GetProperty("present").GetBoolean());
        Assert.True(observation.GetProperty("discrepancy").GetBoolean());
        await _db.Facility().Condition(asset, new("Đã sửa", "working", null), Ct);
        var id = result.GetProperty("session").GetProperty("id").GetGuid();
        var reread = Json(await _db.Facility().Inventory(id, null, new(), Ct));
        Assert.True(Assert.Single(reread.GetProperty("observations").EnumerateArray()).GetProperty("discrepancy").GetBoolean());
        var export = await _db.Facility().Export(new("inventory", "xlsx", null, null, null, null), Ct);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", export.ContentType);
        using var zip = new System.IO.Compression.ZipArchive(new MemoryStream(export.Content));
        using var reader = new StreamReader(zip.GetEntry("xl/worksheets/sheet1.xml")!.Open());
        Assert.Contains("Máy chiếu tiếng Việt", await reader.ReadToEndAsync());
        await Assert.ThrowsAsync<ArgumentException>(() => _db.Facility().Export(new("inventory", "xlsx", null, null, DateOnly.FromDateTime(DateTime.UtcNow), null), Ct));
    }
}
