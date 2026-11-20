using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Models;
using SOMS.Application.Common.Security;
using SOMS.Application.Modules.Facility.DTOs;
using SOMS.Application.Modules.Facility.Interfaces;

namespace SOMS.Api.Controllers;

[ApiController, Route("api/facility"), Authorize]
public sealed class FacilityController : Tv4Controller
{
    private readonly IFacilityService _service;
    public FacilityController(IFacilityService service) => _service = service;
    [HttpGet("me"), RequirePermission(PermissionCodes.RoomsManage)]
    public Task<IActionResult> Profile(CancellationToken ct) => Execute(() => _service.Profile(null, ct));
    [HttpPut("me"), RequirePermission(PermissionCodes.RoomsManage)]
    public Task<IActionResult> UpdateProfile(ProfileUpdate input, CancellationToken ct) => Execute(() => _service.Profile(input, ct));
    [HttpGet("handlers"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Handlers(CancellationToken ct) => Execute(() => _service.Handlers(ct));
    [HttpGet("dashboard"), RequirePermission(PermissionCodes.RoomsManage)]
    public Task<IActionResult> Dashboard(CancellationToken ct) => Execute(() => _service.Dashboard(ct));
    [HttpGet("rooms"), RequirePermission(PermissionCodes.RoomsManage)]
    public Task<IActionResult> Rooms(CancellationToken ct) => Execute(() => _service.Rooms(null, null, ct));
    [HttpPost("rooms"), RequirePermission(PermissionCodes.RoomsManage)]
    public Task<IActionResult> CreateRoom(RoomInput input, CancellationToken ct) => Execute(() => _service.Rooms(null, input, ct), true);
    [HttpPut("rooms/{id:guid}"), RequirePermission(PermissionCodes.RoomsManage)]
    public Task<IActionResult> UpdateRoom(Guid id, RoomInput input, CancellationToken ct) => Execute(() => _service.Rooms(id, input, ct));
    [HttpGet("assets/categories"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Categories(CancellationToken ct) => Execute(() => _service.Categories(null, null, ct));
    [HttpPost("assets/categories"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> CreateCategory(AssetCategoryInput input, CancellationToken ct) => Execute(() => _service.Categories(null, input, ct), true);
    [HttpPut("assets/categories/{id:guid}"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> UpdateCategory(Guid id, AssetCategoryInput input, CancellationToken ct) => Execute(() => _service.Categories(id, input, ct));
    [HttpGet("assets"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Assets([FromQuery] AssetQuery query, CancellationToken ct) => Execute(() => _service.Assets(null, null, query, ct));
    [HttpPost("assets"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> CreateAsset(AssetInput input, CancellationToken ct) => Execute(() => _service.Assets(null, input, new AssetQuery(), ct), true);
    [HttpPut("assets/{id:guid}"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> UpdateAsset(Guid id, AssetInput input, CancellationToken ct) => Execute(() => _service.Assets(id, input, new AssetQuery(), ct));
    [HttpPost("assets/assign"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Assign(AssetAssignInput input, CancellationToken ct) => Execute(() => _service.Assign(input, ct));
    [HttpPost("assets/{id:guid}/condition"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Condition(Guid id, AssetConditionInput input, CancellationToken ct) => Execute(() => _service.Condition(id, input, ct));
    [HttpGet("assets/{id:guid}/history"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> History(Guid id, CancellationToken ct) => Execute(() => _service.History(id, ct));
    [HttpGet("inventory"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Inventory([FromQuery] AssetQuery query, CancellationToken ct) => Execute(() => _service.Inventory(null, null, query, ct));
    [HttpPost("inventory"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> CountInventory(InventoryInput input, CancellationToken ct) => Execute(() => _service.Inventory(null, input, new AssetQuery(), ct), true);
    [HttpGet("inventory/{id:guid}"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> ReadInventory(Guid id, CancellationToken ct) => Execute(() => _service.Inventory(id, null, new AssetQuery(), ct));
    [HttpGet("borrow-requests"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Loans(CancellationToken ct) => Execute(() => _service.Loans(null, ct));
    [HttpPost("borrow-requests"), RequirePermission(PermissionCodes.WorkflowSubmit)]
    public Task<IActionResult> RequestLoan(BorrowInput input, CancellationToken ct) => Execute(() => _service.Loans(input, ct), true);
    [HttpPost("borrow-requests/{id:guid}/handover"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Handover(Guid id, HandoverInput input, CancellationToken ct) => Execute(() => _service.Handover(id, input, ct));
    [HttpPost("borrow-requests/{id:guid}/return"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Return(Guid id, AssetConditionInput input, CancellationToken ct) => Execute(() => _service.Return(id, input, ct));
    [HttpGet("incidents"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Incidents(CancellationToken ct) => Execute(() => _service.Incidents(null, ct));
    [HttpPost("incidents"), RequirePermission(PermissionCodes.WorkflowSubmit)]
    public Task<IActionResult> ReportIncident(IncidentInput input, CancellationToken ct) => Execute(() => _service.Incidents(input, ct), true);
    [HttpPost("incidents/{id:guid}/severity"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Severity(Guid id, SeverityInput input, CancellationToken ct) => Execute(() => _service.Severity(id, input, ct));
    [HttpGet("repair-requests"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Repairs(CancellationToken ct) => Execute(() => _service.Repairs(null, null, ct));
    [HttpPost("repair-requests"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> CreateRepair(RepairInput input, CancellationToken ct) => Execute(() => _service.Repairs(input, null, ct), true);
    [HttpPost("repair-requests/{id:guid}/handler"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Handler(Guid id, HandlerInput input, CancellationToken ct) => Execute(() => _service.Handler(id, input, ct));
    [HttpPost("repair-requests/{id:guid}/progress"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Progress(Guid id, ProgressInput input, CancellationToken ct) => Execute(() => _service.Progress(id, input, ct));
    [HttpPost("repair-requests/{id:guid}/result"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Result(Guid id, WorkResultInput input, CancellationToken ct) => Execute(() => _service.Result(id, input, ct));
    [HttpPost("repair-requests/{id:guid}/complete"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Complete(Guid id, CancellationToken ct) => Execute(() => _service.Complete(id, ct));
    [HttpGet("maintenance"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Maintenance([FromQuery] Guid? assetId, [FromQuery] string? status, CancellationToken ct) => Execute(() => _service.Maintenance(null, assetId, status, ct));
    [HttpPost("maintenance"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> Schedule(MaintenanceInput input, CancellationToken ct) => Execute(() => _service.Maintenance(input, null, null, ct), true);
    [HttpPost("maintenance/{id:guid}/handler"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> MaintenanceHandler(Guid id, HandlerInput input, CancellationToken ct) => Execute(() => _service.Handler(id, input, ct));
    [HttpPost("maintenance/{id:guid}/result"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> MaintenanceResult(Guid id, WorkResultInput input, CancellationToken ct) => Execute(() => _service.MaintenanceResult(id, input, ct));
    [HttpGet("proposals"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Proposals(CancellationToken ct) => Execute(() => _service.Proposals(null, ct));
    [HttpPost("proposals"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Propose(ProposalInput input, CancellationToken ct) => Execute(() => _service.Proposals(input, ct), true);
    [HttpPost("proposals/{id:guid}/decision"), RequirePermission(PermissionCodes.FacilitiesApprovePurchase)]
    public Task<IActionResult> Decide(Guid id, DecisionInput input, CancellationToken ct) => Execute(() => _service.DecideProposal(id, input, ct));
    [HttpGet("repair-history"), RequirePermission(PermissionCodes.RepairsManage)]
    public Task<IActionResult> RepairHistory([FromQuery] Guid? assetId, CancellationToken ct) => Execute(() => _service.Repairs(null, assetId, ct));
    [HttpGet("stats"), RequirePermission(PermissionCodes.RoomsManage)]
    public Task<IActionResult> Stats(CancellationToken ct) => Execute(() => _service.Stats(ct));
    [HttpPost("reports/export"), RequirePermission(PermissionCodes.AssetsManage)]
    public Task<IActionResult> Export(FacilityExportInput input, CancellationToken ct) => Download(() => _service.Export(input, ct));
}
