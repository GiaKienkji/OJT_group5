using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;
using static SOMS.UnitTests.FinanceServiceTests;

namespace SOMS.UnitTests;

[Collection("TV4 PostgreSQL")]
public sealed class Tv4HttpTests
{
    private readonly Tv4PostgresFixture _db;
    public Tv4HttpTests(Tv4PostgresFixture db) => _db = db;
    private async Task Login(HttpClient client, Guid actor)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { emailOrCode = Tv4PostgresFixture.Email(actor), password = _db.TestPassword });
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"Test-only login failed: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync()}");
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", json.GetProperty("accessToken").GetString());
    }
    [PostgresFact]
    public async Task RealJwt_UsesCurrentMembershipAndPermissions_AndReturnsTypedJson()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _db.ConnectionString
            }));
        });
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/finance/dashboard")).StatusCode);
        await Login(client, _db.Actor);
        var dashboard = await client.GetAsync("/api/finance/dashboard");
        Assert.True(dashboard.StatusCode == HttpStatusCode.OK, $"Dashboard rejected token: {(int)dashboard.StatusCode} {dashboard.Headers.WwwAuthenticate}");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/finance/lookups")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/facility/rooms")).StatusCode);
        var me = await client.PutAsJsonAsync("/api/finance/me", new { fullName = "Kế toán đã cập nhật", phone = "0000000000", role = "school_management", schoolId = _db.OtherSchool });
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        Assert.Equal("Kế toán đã cập nhật", (await me.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("fullName").GetString());
        var (campaign, charge) = await SetupCharge(_db);
        var paymentResponse = await client.PostAsJsonAsync("/api/finance/payments", new { studentId = _db.Student, amount = 10m, paymentMethod = "cash", allocations = new[] { new { chargeId = charge, amount = 10m } } });
        Assert.Equal(HttpStatusCode.Created, paymentResponse.StatusCode);
        var paymentId = (await paymentResponse.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/finance/payments/{paymentId}/verify", new { decision = "verified" })).StatusCode);
        var payment = Assert.Single(await _db.Rows("SELECT * FROM public.payments WHERE id=@id", ("id", paymentId)));
        var history = await client.GetFromJsonAsync<JsonElement>("/api/finance/payment-history?studentId=" + _db.Student);
        var paidEntry = history.EnumerateArray().Single(r => r.GetProperty("id").GetGuid() == payment.Get<Guid>("id"));
        Assert.Equal(JsonValueKind.Array, paidEntry.GetProperty("allocations").ValueKind);
        Assert.Equal("Nguyễn Ánh", paidEntry.GetProperty("studentName").GetString());
        Assert.Equal("Lớp 10A1", paidEntry.GetProperty("className").GetString());
        Assert.Equal(_db.Actor, paidEntry.GetProperty("recordedBy").GetGuid());
        Assert.Equal(JsonValueKind.Array, paidEntry.GetProperty("history").ValueKind);
        foreach (var route in new[] { "/api/finance/exemptions/", "/api/finance/adjustments/", "/api/facility/proposals/" })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync(route + Guid.NewGuid() + "/decision", new { decision = "approved" })).StatusCode);
        }
        await Login(client, _db.SecondAccountant);
        foreach (var route in new[] { "/api/finance/exemptions/", "/api/finance/adjustments/", "/api/facility/proposals/" })
            Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync(route + Guid.NewGuid() + "/decision", new { decision = "approved" })).StatusCode);
        await Login(client, _db.OtherActor);
        var otherSchoolReminder = await client.PostAsJsonAsync("/api/finance/debts/" + charge + "/reminder", new { channel = "in_app", requestKey = Guid.NewGuid() });
        Assert.Equal(HttpStatusCode.NotFound, otherSchoolReminder.StatusCode);
        await Login(client, _db.Actor);
        await _db.Sql("UPDATE public.school_memberships SET valid_to=CURRENT_DATE-1 WHERE user_id=@id", ("id", _db.Actor));
        try { Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/finance/dashboard")).StatusCode); }
        finally { await _db.Sql("UPDATE public.school_memberships SET valid_to=NULL WHERE user_id=@id", ("id", _db.Actor)); }
        await _db.Sql("UPDATE public.profiles SET status='suspended' WHERE id=@id", ("id", _db.Actor));
        try { Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/finance/dashboard")).StatusCode); }
        finally { await _db.Sql("UPDATE public.profiles SET status='active' WHERE id=@id", ("id", _db.Actor)); }
        var nullBank = await client.PostAsJsonAsync("/api/finance/bank-transactions/import", new { source = "TEST", transactions = new object?[] { null } });
        Assert.Equal(HttpStatusCode.BadRequest, nullBank.StatusCode);
        var nullFilter = await client.PostAsJsonAsync("/api/finance/reports/export", new { reportType = "collection", format = "pdf", filters = (object?)null });
        Assert.Equal(HttpStatusCode.BadRequest, nullFilter.StatusCode);
        await Login(client, _db.FacilityActor);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/facility/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/facility/handlers")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/finance/dashboard")).StatusCode);
        var export = await client.PostAsJsonAsync("/api/facility/reports/export", new { reportType = "inventory", format = "pdf" });
        Assert.Equal(HttpStatusCode.OK, export.StatusCode);
        Assert.Equal("application/pdf", export.Content.Headers.ContentType?.MediaType);
        Assert.Equal("attachment", export.Content.Headers.ContentDisposition?.DispositionType);
        await Login(client, _db.Approver);
        var proposal = Assert.Single(Rows(await _db.Facility(_db.Approver).Proposals(new("purchase", "Tự duyệt bị cấm", "Kiểm tra", 1, null, null), CancellationToken.None)).Where(r => r.Text("title") == "Tự duyệt bị cấm"));
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/facility/proposals/" + proposal.Get<Guid>("id") + "/decision", new { decision = "approved" })).StatusCode);
    }
    [PostgresFact]
    public async Task ProgramKestrel_NormalLoginAndAuthorizedMutation_OnLoopbackDisposableDatabase()
    {
        var api = typeof(Program).Assembly.Location;
        var host = Environment.GetEnvironmentVariable("SOMS_DOTNET") ?? @"C:\Users\yvii\.dotnet\dotnet.exe";
        var start = new ProcessStartInfo(host) { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true, WorkingDirectory = AppContext.BaseDirectory };
        start.ArgumentList.Add(api);
        start.ArgumentList.Add("--urls=http://127.0.0.1:5188");
        start.Environment["ASPNETCORE_ENVIRONMENT"] = "Testing";
        start.Environment["DOTNET_ENVIRONMENT"] = "Testing";
        start.Environment["ConnectionStrings__DefaultConnection"] = _db.ConnectionString;
        start.Environment["Jwt__Secret"] = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));
        start.Environment["Logging__LogLevel__Default"] = "Warning";
        using var process = Process.Start(start) ?? throw new InvalidOperationException("Could not start isolated Kestrel.");
        var stdout = process.StandardOutput.ReadToEndAsync();
        var stderr = process.StandardError.ReadToEndAsync();
        try
        {
            using var client = new HttpClient { BaseAddress = new Uri("http://127.0.0.1:5188"), Timeout = TimeSpan.FromSeconds(10) };
            var ready = false;
            for (var i = 0; i < 80; i++)
            {
                if (process.HasExited) throw new InvalidOperationException("Isolated API exited before readiness.");
                try { ready = (await client.GetAsync("/api/finance/dashboard")).StatusCode == HttpStatusCode.Unauthorized; }
                catch (HttpRequestException) { }
                if (ready) break;
                await Task.Delay(100);
            }
            Assert.True(ready);
            await Login(client, _db.FacilityActor);
            var created = await client.PostAsJsonAsync("/api/facility/rooms", new { code = "HTTP-" + Guid.NewGuid().ToString("N"), name = "Phòng HTTP tiếng Việt", roomType = "classroom", capacity = 25, status = "available" });
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var room = await created.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("Phòng HTTP tiếng Việt", room.GetProperty("name").GetString());
            Assert.Equal(_db.School, room.GetProperty("schoolId").GetGuid());
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/facility/stats")).StatusCode);
        }
        finally
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
            await process.WaitForExitAsync();
            await stdout;
            await stderr;
        }
    }
}
