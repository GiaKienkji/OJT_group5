using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SOMS.Api.Authorization;
using SOMS.Application.Common.Models;
using SOMS.Infrastructure.Services;

namespace SOMS.Api.Controllers;

public sealed class HttpTv4Identity : ITv4Identity
{
    private readonly IHttpContextAccessor _accessor;
    public HttpTv4Identity(IHttpContextAccessor accessor) => _accessor = accessor;
    public Tv4Identity Current
    {
        get
        {
            var user = _accessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true || !Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub"), out var actor) || !Guid.TryParse(user.FindFirstValue("school_id"), out var school) || actor == Guid.Empty || school == Guid.Empty)
                throw new Tv4ForbiddenException("Authenticated actor and school claims are required.");
            return new(actor, school);
        }
    }
}

public abstract class Tv4Controller : Controller
{
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        try
        {
            var permission = context.ActionDescriptor.EndpointMetadata.OfType<RequirePermissionAttribute>().Select(a => a.Permission).ToArray();
            var store = HttpContext.RequestServices.GetRequiredService<Tv4Store>();
            await store.Run(false, async s => { foreach (var code in permission) await s.RequirePermission(code); return true; }, HttpContext.RequestAborted);
            await next();
        }
        catch (Tv4ForbiddenException ex) { context.Result = StatusCode(403, new { message = ex.Message }); }
    }
    protected async Task<IActionResult> Execute(Func<Task<object>> action, bool created = false)
    {
        try { return created ? StatusCode(201, await action()) : Ok(await action()); }
        catch (Tv4ForbiddenException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    protected async Task<IActionResult> Download(Func<Task<Tv4File>> action)
    {
        try { var file = await action(); return File(file.Content, file.ContentType, file.FileName); }
        catch (Tv4ForbiddenException ex) { return StatusCode(403, new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}

public sealed class Tv4RowJsonConverter : JsonConverter<Tv4Row>
{
    public override Tv4Row Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options) => throw new JsonException("TV4 rows are response-only.");
    public override void Write(Utf8JsonWriter writer, Tv4Row row, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        foreach (var pair in row)
        {
            var words = pair.Key.Split('_'); var name = words[0] + string.Concat(words.Skip(1).Select(w => w.Length == 0 ? w : char.ToUpperInvariant(w[0]) + w[1..])); writer.WritePropertyName(name); JsonSerializer.Serialize(writer, pair.Value, options);
        }
        writer.WriteEndObject();
    }
}
