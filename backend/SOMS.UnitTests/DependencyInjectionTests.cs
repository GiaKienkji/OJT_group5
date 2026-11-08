using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SOMS.Application.Common.Interfaces;
using SOMS.Infrastructure;
using SOMS.Infrastructure.Data;
using Xunit;

namespace SOMS.UnitTests;

public class DependencyInjectionTests
{
    [Fact]
    public void AddInfrastructure_ShouldRegisterSomsDbContextAndHealthService()
    {
        // Arrange
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=postgres;Username=postgres;Password=test;"
            })
            .Build();

        services.AddSingleton<IConfiguration>(configuration);
        services.AddLogging();

        // Act
        services.AddInfrastructure(configuration);
        var provider = services.BuildServiceProvider();

        // Assert
        var dbContext = provider.GetService<SomsDbContext>();
        Assert.NotNull(dbContext);

        var healthService = provider.GetService<IDatabaseHealthService>();
        Assert.NotNull(healthService);
    }
}
