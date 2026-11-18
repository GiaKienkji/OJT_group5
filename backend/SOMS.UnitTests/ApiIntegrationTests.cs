using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using SOMS.Application.Common.Interfaces;
using SOMS.Application.Common.Models;
using Xunit;

namespace SOMS.UnitTests;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureTestServices(services =>
            {
                var controllerEnvironment = new Mock<IWebHostEnvironment>();
                controllerEnvironment.SetupGet(environment => environment.EnvironmentName).Returns("Development");
                services.AddSingleton(controllerEnvironment.Object);
            });
        });
    }

    [Theory]
    [InlineData("context")]
    [InlineData("academic-years")]
    [InlineData("semesters")]
    [InlineData("grade-levels")]
    [InlineData("classes")]
    [InlineData("classes/context")]
    [InlineData("students")]
    [InlineData("students/context")]
    [InlineData("students/profile-options")]
    [InlineData("subjects")]
    [InlineData("subjects/context")]
    [InlineData("timetables/context")]
    [InlineData("timetables")]
    [InlineData("schedule/context")]
    [InlineData("events/context")]
    [InlineData("dashboard")]
    [InlineData("exams")]
    [InlineData("classes/65a9c997-0256-4be6-87f8-f3b46e349b06/enrollments")]
    public async Task AcademicReads_WithoutToken_Return401(string resource)
    {
        using var client = _factory.CreateClient();
        using var response = await client.GetAsync($"/api/academic/{resource}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetDatabaseHealth_DefaultConfiguration_Returns503WithSafeJson()
    {
        // Arrange
        using var host = _factory.WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Host=YOUR_SUPABASE_HOST"
            })));
        using var client = host.CreateClient();

        // Act
        var response = await client.GetAsync("/api/dev/database-health");

        // Assert
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DatabaseHealthResult>();
        Assert.NotNull(result);
        Assert.False(result.Connected);
        Assert.Equal("PostgreSQL", result.Database);
        Assert.Equal("unhealthy", result.Status);
        Assert.Equal("Configuration", result.DiagnosticCategory);

        // Security check: ensure no passwords or internal secrets leaked
        var rawString = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("YOUR_DATABASE_PASSWORD", rawString);
        Assert.DoesNotContain("password=", rawString, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetDatabaseHealth_WhenHealthy_Returns200AndValidJson()
    {
        // Arrange
        var mockHealthService = new Mock<IDatabaseHealthService>();
        mockHealthService
            .Setup(s => s.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(DatabaseHealthResult.Healthy(12, new List<string> { "schools", "classes" }));

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddScoped(_ => mockHealthService.Object);
            });
        }).CreateClient();

        // Act
        var response = await client.GetAsync("/api/dev/database-health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DatabaseHealthResult>();
        Assert.NotNull(result);
        Assert.True(result.Connected);
        Assert.Equal("healthy", result.Status);
        Assert.Equal("PostgreSQL", result.Database);
        Assert.Equal(2, result.TableCount);
    }
}
