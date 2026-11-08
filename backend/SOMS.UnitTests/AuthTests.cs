using Xunit;
using SOMS.Application.Common.Security;

namespace SOMS.UnitTests;

public class AuthTests
{
    [Theory]
    [InlineData("system_admin", "/admin/dashboard")]
    [InlineData("school_management", "/management/dashboard")]
    [InlineData("academic_affairs", "/academic/dashboard")]
    [InlineData("head_of_department", "/department/dashboard")]
    [InlineData("teacher", "/teacher/dashboard")]
    [InlineData("accountant", "/accountant/dashboard")]
    [InlineData("facility_staff", "/facilities/dashboard")]
    [InlineData("student", "/student/dashboard")]
    [InlineData("parent", "/parent/dashboard")]
    public void RoleCodes_GetDashboardRoute_ReturnsCorrectRouteForAll9Roles(string roleCode, string expectedRoute)
    {
        var route = RoleCodes.GetDashboardRoute(roleCode);
        Assert.Equal(expectedRoute, route);
    }

    [Fact]
    public void RoleCodes_All_ContainsExactly9CoreRoles()
    {
        Assert.Equal(9, RoleCodes.All.Length);
        Assert.Contains("system_admin", RoleCodes.All);
        Assert.Contains("school_management", RoleCodes.All);
        Assert.Contains("academic_affairs", RoleCodes.All);
        Assert.Contains("head_of_department", RoleCodes.All);
        Assert.Contains("teacher", RoleCodes.All);
        Assert.Contains("accountant", RoleCodes.All);
        Assert.Contains("facility_staff", RoleCodes.All);
        Assert.Contains("student", RoleCodes.All);
        Assert.Contains("parent", RoleCodes.All);
    }

    [Fact]
    public void BCrypt_HashAndVerify_Succeeds()
    {
        var password = "SecurePassword@123";
        var hash = BCrypt.Net.BCrypt.HashPassword(password, 10);
        
        Assert.True(BCrypt.Net.BCrypt.Verify(password, hash));
        Assert.False(BCrypt.Net.BCrypt.Verify("WrongPassword", hash));
    }
}
