using System.Data;
using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using SOMS.Application.Common.Interfaces;
using SOMS.Application.Common.Models;
using SOMS.Infrastructure.Data;

namespace SOMS.Infrastructure.Services;

public class DatabaseHealthService : IDatabaseHealthService
{
    private readonly SomsDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseHealthService> _logger;

    public DatabaseHealthService(
        SomsDbContext dbContext,
        IConfiguration configuration,
        ILogger<DatabaseHealthService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DatabaseHealthResult> CheckHealthAsync(CancellationToken cancellationToken = default)
    {
        var rawConnStr = _configuration.GetConnectionString("DefaultConnection");

        // 1. Verify connection string configuration
        if (string.IsNullOrWhiteSpace(rawConnStr) ||
            rawConnStr.Contains("YOUR_SUPABASE_HOST", StringComparison.OrdinalIgnoreCase) ||
            rawConnStr.Contains("YOUR_DATABASE_PASSWORD", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Database connection string is unconfigured or contains placeholder values.");
            return DatabaseHealthResult.NotConfigured(
                "Database connection string is not configured. " +
                "Set 'ConnectionStrings:DefaultConnection' via .NET User Secrets or environment variable ConnectionStrings__DefaultConnection.");
        }

        var stopwatch = Stopwatch.StartNew();

        try
        {
            // 2. Open connection directly to capture precise connection/authentication errors
            var connection = _dbContext.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync(cancellationToken);
            }

            // 3. Inspect application-owned tables in public schema
            var tables = new List<string>();
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_type = 'BASE TABLE'
                ORDER BY table_name;";

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                tables.Add(reader.GetString(0));
            }

            stopwatch.Stop();
            _logger.LogInformation("Database health check succeeded in {ElapsedMs}ms. Found {TableCount} application tables.",
                stopwatch.ElapsedMilliseconds, tables.Count);

            return DatabaseHealthResult.Healthy(stopwatch.ElapsedMilliseconds, tables);
        }
        catch (PostgresException pgEx)
        {
            stopwatch.Stop();
            var category = ClassifyPostgresError(pgEx.SqlState);
            var safeMessage = $"PostgreSQL Error [{pgEx.SqlState}]: {category}. Verify database user, password, and permissions.";
            _logger.LogError(pgEx, "PostgreSQL error during database health check: SqlState={SqlState}, Message={ErrorMessage}",
                pgEx.SqlState, pgEx.MessageText);

            return DatabaseHealthResult.Failed(category, safeMessage);
        }
        catch (AuthenticationException authEx)
        {
            stopwatch.Stop();
            _logger.LogError(authEx, "SSL/TLS handshake failed connecting to database.");
            return DatabaseHealthResult.Failed("SslTlsNegotiation",
                "SSL/TLS handshake failed. Ensure SSL Mode is set to Require and your network supports TLS connections.");
        }
        catch (TimeoutException timeoutEx)
        {
            stopwatch.Stop();
            _logger.LogError(timeoutEx, "Database connection attempt timed out.");
            return DatabaseHealthResult.Failed("ConnectionTimeout",
                "Database connection timed out. If using Supabase Direct Connection on an IPv4 network, switch to Supabase Session Pooler.");
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            var rootEx = ex.GetBaseException();
            if (rootEx is SocketException sockEx)
            {
                var category = ClassifySocketError(sockEx.SocketErrorCode);
                var safeMessage = $"Network Error [{sockEx.SocketErrorCode}]: {category}. Verify Supabase host, port, and network connectivity.";
                _logger.LogError(ex, "Socket error connecting to database: SocketErrorCode={ErrorCode}", sockEx.SocketErrorCode);
                return DatabaseHealthResult.Failed("NetworkConnectivity", safeMessage);
            }

            _logger.LogError(ex, "Unexpected error during database health check.");
            return DatabaseHealthResult.Failed("GeneralFailure",
                "An error occurred while connecting to PostgreSQL. Safe diagnostics have been logged to the server console.");
        }
    }

    private static string ClassifyPostgresError(string? sqlState) => sqlState switch
    {
        "28P01" => "Invalid password",
        "28000" => "Invalid authorization / user credentials",
        "3D000" => "Database does not exist",
        "42501" => "Insufficient privilege for public schema",
        "08001" => "Unable to establish SQL connection",
        "08006" => "Connection failure",
        "57P01" => "Admin shutdown",
        "57P03" => "Cannot connect now / server in recovery",
        _ => "Database engine rejected request"
    };

    private static string ClassifySocketError(SocketError errorCode) => errorCode switch
    {
        SocketError.HostNotFound => "DNS resolution failed - hostname not found",
        SocketError.TimedOut => "Connection timed out",
        SocketError.ConnectionRefused => "Connection refused on specified port",
        SocketError.NetworkUnreachable => "Network unreachable",
        _ => $"Socket error ({errorCode})"
    };
}
