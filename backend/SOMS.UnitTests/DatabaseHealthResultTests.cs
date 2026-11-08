using SOMS.Application.Common.Models;
using Xunit;

namespace SOMS.UnitTests;

public class DatabaseHealthResultTests
{
    [Fact]
    public void Healthy_ShouldPopulateCorrectFields()
    {
        var tables = new List<string> { "schools", "academic_years" };
        var result = DatabaseHealthResult.Healthy(42, tables);

        Assert.Equal("healthy", result.Status);
        Assert.Equal("PostgreSQL", result.Database);
        Assert.True(result.Connected);
        Assert.Equal(42, result.LatencyMs);
        Assert.Equal(2, result.TableCount);
        Assert.Equal(tables, result.ApplicationTables);
    }

    [Fact]
    public void NotConfigured_ShouldIndicateUnhealthyAndConfigurationCategory()
    {
        var result = DatabaseHealthResult.NotConfigured("Config missing");

        Assert.Equal("unhealthy", result.Status);
        Assert.False(result.Connected);
        Assert.Equal("Configuration", result.DiagnosticCategory);
        Assert.Equal("Config missing", result.Message);
    }

    [Fact]
    public void Failed_ShouldIndicateFailureWithSafeDetails()
    {
        var result = DatabaseHealthResult.Failed("NetworkConnectivity", "DNS resolution failed");

        Assert.Equal("unhealthy", result.Status);
        Assert.False(result.Connected);
        Assert.Equal("NetworkConnectivity", result.DiagnosticCategory);
        Assert.Equal("DNS resolution failed", result.Message);
    }
}
