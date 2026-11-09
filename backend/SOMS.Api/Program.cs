using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using SOMS.Api.Authorization;
using SOMS.Infrastructure;
using SOMS.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Load local .env file if present in solution or project directory (Development only)
if (builder.Environment.IsDevelopment())
{
    var envFiles = new[]
    {
        Path.Combine(builder.Environment.ContentRootPath, ".env"),
        Path.Combine(builder.Environment.ContentRootPath, "..", ".env"),
        Path.Combine(builder.Environment.ContentRootPath, "..", "..", ".env")
    };

    foreach (var envPath in envFiles)
    {
        if (File.Exists(envPath))
        {
            foreach (var line in File.ReadAllLines(envPath))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
                var parts = trimmed.Split('=', 2);
                if (parts.Length == 2)
                {
                    var key = parts[0].Trim();
                    var value = parts[1].Trim().Trim('"', '\'');
                    Environment.SetEnvironmentVariable(key, value);
                }
            }
            break;
        }
    }

    // Reload configuration to pick up any environment variables set from .env
    builder.Configuration.AddEnvironmentVariables();
    builder.Configuration.AddUserSecrets<Program>(optional: true);
}

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure CORS for Vite React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Permission-Based Policy Provider
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

// Configure Swagger with JWT Bearer authentication support
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SOMS Web API (School Operations Management System)",
        Version = "v1",
        Description = "ASP.NET Core Web API with Complete RBAC & Supabase PostgreSQL database."
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT Bearer token: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = "Bearer",
            Type = ReferenceType.SecurityScheme
        }
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

// Register Infrastructure services (DbContext, Health Services, Npgsql, Auth, JWT)
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SOMS API v1");
    });
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed initial system data (Roles, Permissions, Academic Year, Sample Approvals, Tasks)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<SomsDbContext>();
        await DbInitializer.SeedAsync(context, logger);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "DbInitializer bypassed or skipped during startup.");
    }
}

app.Run();

// Required for integration testing or WebApplicationFactory
public partial class Program { }
