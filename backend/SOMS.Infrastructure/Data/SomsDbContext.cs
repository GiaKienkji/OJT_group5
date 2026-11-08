using Microsoft.EntityFrameworkCore;
using SOMS.Domain.Entities;

namespace SOMS.Infrastructure.Data;

/// <summary>
/// Entity Framework Core DbContext for SOMS (School Operations Management System).
/// Connects to the existing Supabase PostgreSQL database.
/// </summary>
public class SomsDbContext : DbContext
{
    public SomsDbContext(DbContextOptions<SomsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<School> Schools => Set<School>();
    public DbSet<SchoolMembership> SchoolMemberships => Set<SchoolMembership>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SomsDbContext).Assembly);
    }
}
