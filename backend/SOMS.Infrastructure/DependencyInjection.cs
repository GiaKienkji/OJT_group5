using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SOMS.Application.Common.Interfaces;
using SOMS.Application.Modules.StudentPortal.Interfaces;
using SOMS.Infrastructure.Authorization;
using SOMS.Infrastructure.Data;
using SOMS.Infrastructure.Services;

namespace SOMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<SomsDbContext>(options =>
        {
            if (!string.IsNullOrWhiteSpace(connectionString) &&
                !connectionString.Contains("YOUR_SUPABASE_HOST", StringComparison.OrdinalIgnoreCase))
            {
                options.UseNpgsql(connectionString, npgsqlOptions =>
                {
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorCodesToAdd: null);
                    npgsqlOptions.CommandTimeout(30);
                });
            }
            else
            {
                options.UseNpgsql("Host=localhost;Database=postgres;Username=postgres;Password=postgres;");
            }
        });

        // Register Core Services
        services.AddScoped<IDatabaseHealthService, DatabaseHealthService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IStudentPortalService, StudentPortalService>();

        // Register Permission Authorization Handler
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

        // Configure JWT Authentication
        var jwtSecret = configuration["Jwt:Secret"] ?? "SOMS_SUPER_SECURE_JWT_SECRET_KEY_FOR_LOCAL_DEV_2026_MIN_32_CHARS!!";
        var key = Encoding.UTF8.GetBytes(jwtSecret);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = configuration["Jwt:Issuer"] ?? "soms-api",
                ValidateAudience = true,
                ValidAudience = configuration["Jwt:Audience"] ?? "soms-app",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });

        return services;
    }
}
