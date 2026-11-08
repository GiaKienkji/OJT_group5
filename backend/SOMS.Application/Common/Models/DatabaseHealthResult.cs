namespace SOMS.Application.Common.Models;

public class DatabaseHealthResult
{
    public string Status { get; set; } = "unhealthy";
    public string Database { get; set; } = "PostgreSQL";
    public bool Connected { get; set; }
    public string? Message { get; set; }
    public string? DiagnosticCategory { get; set; }
    public long? LatencyMs { get; set; }
    public List<string>? ApplicationTables { get; set; }
    public int? TableCount { get; set; }

    public static DatabaseHealthResult Healthy(long latencyMs, List<string> tables) => new()
    {
        Status = "healthy",
        Database = "PostgreSQL",
        Connected = true,
        LatencyMs = latencyMs,
        ApplicationTables = tables,
        TableCount = tables.Count,
        Message = "Successfully connected to PostgreSQL database."
    };

    public static DatabaseHealthResult NotConfigured(string message) => new()
    {
        Status = "unhealthy",
        Database = "PostgreSQL",
        Connected = false,
        DiagnosticCategory = "Configuration",
        Message = message
    };

    public static DatabaseHealthResult Failed(string category, string safeMessage) => new()
    {
        Status = "unhealthy",
        Database = "PostgreSQL",
        Connected = false,
        DiagnosticCategory = category,
        Message = safeMessage
    };
}
