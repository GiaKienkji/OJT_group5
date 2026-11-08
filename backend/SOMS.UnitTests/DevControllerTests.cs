using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SOMS.Api.Controllers;
using SOMS.Application.Common.Interfaces;
using SOMS.Application.Common.Models;
using Xunit;

namespace SOMS.UnitTests;

public class DevControllerTests
{
    private readonly Mock<IDatabaseHealthService> _healthServiceMock;
    private readonly Mock<IWebHostEnvironment> _envMock;

    public DevControllerTests()
    {
        _healthServiceMock = new Mock<IDatabaseHealthService>();
        _envMock = new Mock<IWebHostEnvironment>();
    }

    [Fact]
    public async Task GetDatabaseHealth_WhenHealthyInDevelopment_ReturnsOkResult()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Development");
        _healthServiceMock.Setup(h => h.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(DatabaseHealthResult.Healthy(15, new List<string> { "schools", "classes", "students" }));

        var controller = new DevController(_healthServiceMock.Object, _envMock.Object);

        // Act
        var actionResult = await controller.GetDatabaseHealth(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<DatabaseHealthResult>(okResult.Value);
        Assert.True(response.Connected);
        Assert.Equal("healthy", response.Status);
        Assert.Equal(3, response.TableCount);
    }

    [Fact]
    public async Task GetDatabaseHealth_WhenUnhealthyInDevelopment_Returns503ServiceUnavailable()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Development");
        _healthServiceMock.Setup(h => h.CheckHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(DatabaseHealthResult.Failed("NetworkConnectivity", "Connection failed"));

        var controller = new DevController(_healthServiceMock.Object, _envMock.Object);

        // Act
        var actionResult = await controller.GetDatabaseHealth(CancellationToken.None);

        // Assert
        var objResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, objResult.StatusCode);
        var response = Assert.IsType<DatabaseHealthResult>(objResult.Value);
        Assert.False(response.Connected);
        Assert.Equal("unhealthy", response.Status);
    }

    [Fact]
    public async Task GetDatabaseHealth_WhenInProduction_ReturnsNotFound()
    {
        // Arrange
        _envMock.Setup(e => e.EnvironmentName).Returns("Production");

        var controller = new DevController(_healthServiceMock.Object, _envMock.Object);

        // Act
        var actionResult = await controller.GetDatabaseHealth(CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(actionResult);
        Assert.Contains("restricted", notFoundResult.Value?.ToString(), StringComparison.OrdinalIgnoreCase);
        _healthServiceMock.Verify(h => h.CheckHealthAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
