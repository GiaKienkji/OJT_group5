namespace SOMS.Application.Common.Models;

public sealed record Tv4Identity(Guid ActorId, Guid SchoolId);
public interface ITv4Identity
{
    Tv4Identity Current { get; }
}
public sealed class Tv4ForbiddenException : Exception
{
    public Tv4ForbiddenException(string message) : base(message) { }
}
public sealed record Tv4File(byte[] Content, string ContentType, string FileName);
public sealed record ProfileUpdate(string FullName, string? Phone);
public sealed record DecisionInput(string Decision, string? Note);
public sealed record LookupQuery(Guid? AcademicYearId, Guid? GradeLevelId, Guid? ClassId, string? Search);
