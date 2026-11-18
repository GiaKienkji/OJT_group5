using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using SOMS.Application.Modules.Academic;
using SOMS.Infrastructure.Data;
using Xunit;
using Xunit.Abstractions;

namespace SOMS.UnitTests;

public sealed class HostedAcademicSmokeTests(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    : IClassFixture<WebApplicationFactory<Program>>
{
    internal const string ConnectionVariable = "SOMS_ACADEMIC_HOSTED_READONLY_DB";

    [HostedAcademicSmokeFact]
    public async Task AcademicReadRoutesUseTheSharedSupabaseSchema()
    {
        var settings = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable(ConnectionVariable));
        Assert.Equal("aws-1-eu-central-1.pooler.supabase.com", settings.Host);
        Assert.Equal(5432, settings.Port);
        Assert.Equal("postgres", settings.Database);
        Assert.Equal("postgres.jaivisftvckbaxnnzhbi", settings.Username);
        Assert.Equal(SslMode.VerifyFull, settings.SslMode);

        var (user, school) = await GetAcademicScope(settings.ConnectionString);
        var key = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(32));
        using var host = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureTestServices(services =>
            {
                services.AddScoped(_ => new SomsDbContext(new DbContextOptionsBuilder<SomsDbContext>()
                    .UseNpgsql(settings.ConnectionString).Options));
                services.PostConfigure<JwtBearerOptions>("Bearer", options =>
                {
                    options.TokenValidationParameters.IssuerSigningKey = key;
                    options.TokenValidationParameters.ValidIssuer = "hosted-smoke";
                    options.TokenValidationParameters.ValidAudience = "hosted-smoke";
                });
            });
        });

        using var api = host.CreateClient();
        await Check(api, "dashboard", HttpStatusCode.Unauthorized);
        var token = new JwtSecurityToken("hosted-smoke", "hosted-smoke",
            [new Claim(ClaimTypes.NameIdentifier, user.ToString())],
            expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        api.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
        var scope = $"schoolId={school}";

        foreach (var path in new[]
        {
            "context", "classes/context", $"classes?{scope}", $"students?{scope}", $"subjects?{scope}",
            $"academic-years?{scope}", $"dashboard?{scope}", $"dashboard/filters?{scope}", "events/context",
            $"exams/semesters?{scope}", "timetables/context"
        })
            await Check(api, path, HttpStatusCode.OK);

        var schools = await api.GetFromJsonAsync<ScheduleSchool[]>("/api/academic/schedule/context");
        var localDay = Assert.Single(schools!, entry => entry.Id == school).Today.ToString("yyyy-MM-dd");
        await Check(api, $"schedule?{scope}&from={localDay}&to={localDay}", HttpStatusCode.OK);
        await Check(api, $"substitutions/sessions?{scope}&onDate={localDay}", HttpStatusCode.OK);
        await Check(api, $"classes?schoolId={Guid.NewGuid()}", HttpStatusCode.Forbidden);

        var semesters = await api.GetFromJsonAsync<SemesterOption[]>($"/api/academic/timetables/semesters?{scope}");
        output.WriteLine($"Available semesters in the selected school: {semesters!.Length}");
        if (semesters.FirstOrDefault() is { } semester)
        {
            var term = $"{scope}&semesterId={semester.Id}";
            await Check(api, $"timetables?{term}", HttpStatusCode.OK);
            await Check(api, $"timetables/options?{term}", HttpStatusCode.OK);
            await Check(api, $"exams?{term}", HttpStatusCode.OK);
            await Check(api, $"exams/options?{term}", HttpStatusCode.OK);
        }
    }

    private async Task Check(HttpClient client, string path, HttpStatusCode expected)
    {
        using var response = await client.GetAsync($"/api/academic/{path}");
        var route = path.Split('?')[0];
        Assert.True(response.StatusCode == expected,
            $"{route} returned HTTP {(int)response.StatusCode}; expected {(int)expected}.");
        output.WriteLine($"{route}: {(int)response.StatusCode}");
    }

    private static async Task<(Guid User, Guid School)> GetAcademicScope(string connectionString)
    {
        await using var database = new NpgsqlConnection(connectionString);
        await database.OpenAsync();
        await using var transaction = await database.BeginTransactionAsync();
        await using (var readOnly = new NpgsqlCommand("SET TRANSACTION READ ONLY", database, transaction))
            await readOnly.ExecuteNonQueryAsync();
        await using var query = new NpgsqlCommand("""
            SELECT m.user_id, m.school_id
            FROM public.school_memberships m
            JOIN public.schools s ON s.id = m.school_id
            JOIN public.profiles p ON p.id = m.user_id
            WHERE m.role_code = 'academic_affairs' AND m.status = 'active'
              AND s.status = 'active' AND p.status = 'active'
              AND (m.valid_from IS NULL OR m.valid_from <= (now() AT TIME ZONE s.timezone)::date)
              AND (m.valid_to IS NULL OR m.valid_to >= (now() AT TIME ZONE s.timezone)::date)
            ORDER BY m.school_id, m.user_id LIMIT 1
            """, database, transaction);
        await using var reader = await query.ExecuteReaderAsync();
        Assert.True(await reader.ReadAsync(), "No active Academic Affairs membership is available for the read smoke test.");
        return (reader.GetGuid(0), reader.GetGuid(1));
    }
}

public sealed class HostedAcademicSmokeFactAttribute : FactAttribute
{
    public HostedAcademicSmokeFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(HostedAcademicSmokeTests.ConnectionVariable)))
            Skip = "Set SOMS_ACADEMIC_HOSTED_READONLY_DB to opt into hosted GET-only verification.";
    }
}
