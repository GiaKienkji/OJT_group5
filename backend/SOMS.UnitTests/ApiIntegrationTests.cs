using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
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
        _factory = factory;
    }

    [Fact]
    public async Task GetDatabaseHealth_DefaultConfiguration_Returns503WithSafeJson()
    {
        // Arrange
        var client = _factory.CreateClient();

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
