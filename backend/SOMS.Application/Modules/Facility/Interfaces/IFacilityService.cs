using SOMS.Application.Common.Models;
using SOMS.Application.Modules.Facility.DTOs;

namespace SOMS.Application.Modules.Facility.Interfaces;

public interface IFacilityService
{
    Task<object> Profile(ProfileUpdate? input, CancellationToken ct);
    Task<object> Handlers(CancellationToken ct);
    Task<object> Dashboard(CancellationToken ct);
    Task<object> Rooms(Guid? id, RoomInput? input, CancellationToken ct);
    Task<object> Categories(Guid? id, AssetCategoryInput? input, CancellationToken ct);
    Task<object> Assets(Guid? id, AssetInput? input, AssetQuery query, CancellationToken ct);
    Task<object> Assign(AssetAssignInput input, CancellationToken ct);
    Task<object> Condition(Guid id, AssetConditionInput input, CancellationToken ct);
    Task<object> History(Guid id, CancellationToken ct);
    Task<object> Inventory(Guid? id, InventoryInput? input, AssetQuery query, CancellationToken ct);
    Task<object> Loans(BorrowInput? input, CancellationToken ct);
    Task<object> Handover(Guid id, HandoverInput input, CancellationToken ct);
    Task<object> Return(Guid id, AssetConditionInput input, CancellationToken ct);
    Task<object> Incidents(IncidentInput? input, CancellationToken ct);
    Task<object> Severity(Guid id, SeverityInput input, CancellationToken ct);
    Task<object> Repairs(RepairInput? input, Guid? assetId, CancellationToken ct);
    Task<object> Handler(Guid id, HandlerInput input, CancellationToken ct);
    Task<object> Progress(Guid id, ProgressInput input, CancellationToken ct);
    Task<object> Result(Guid id, WorkResultInput input, CancellationToken ct);
    Task<object> Complete(Guid id, CancellationToken ct);
    Task<object> Maintenance(MaintenanceInput? input, Guid? assetId, string? status, CancellationToken ct);
    Task<object> MaintenanceResult(Guid id, WorkResultInput input, CancellationToken ct);
    Task<object> Proposals(ProposalInput? input, CancellationToken ct);
    Task<object> DecideProposal(Guid id, DecisionInput input, CancellationToken ct);
    Task<object> Stats(CancellationToken ct);
    Task<Tv4File> Export(FacilityExportInput input, CancellationToken ct);
}
