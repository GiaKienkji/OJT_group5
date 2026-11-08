using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SOMS.Domain.Entities;

namespace SOMS.Infrastructure.Data.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles", "public");
        builder.HasKey(r => r.Code);
        builder.Property(r => r.Code).HasColumnName("code");
        builder.Property(r => r.NameVi).HasColumnName("name_vi");
        builder.Property(r => r.Description).HasColumnName("description");
    }
}

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("permissions", "public");
        builder.HasKey(p => p.Code);
        builder.Property(p => p.Code).HasColumnName("code");
        builder.Property(p => p.Description).HasColumnName("description");
    }
}

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("role_permissions", "public");
        builder.HasKey(rp => new { rp.RoleCode, rp.PermissionCode });
        builder.Property(rp => rp.RoleCode).HasColumnName("role_code");
        builder.Property(rp => rp.PermissionCode).HasColumnName("permission_code");

        builder.HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleCode);

        builder.HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionCode);
    }
}

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.ToTable("profiles", "public");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.FullName).HasColumnName("full_name");
        builder.Property(p => p.Phone).HasColumnName("phone");
        builder.Property(p => p.AvatarPath).HasColumnName("avatar_path");
        builder.Property(p => p.Status).HasColumnName("status");
        builder.Property(p => p.CreatedAt).HasColumnName("created_at");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");
    }
}

public class SchoolConfiguration : IEntityTypeConfiguration<School>
{
    public void Configure(EntityTypeBuilder<School> builder)
    {
        builder.ToTable("schools", "public");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.Code).HasColumnName("code");
        builder.Property(s => s.Name).HasColumnName("name");
        builder.Property(s => s.Level).HasColumnName("level");
        builder.Property(s => s.Email).HasColumnName("email");
        builder.Property(s => s.Phone).HasColumnName("phone");
        builder.Property(s => s.Address).HasColumnName("address");
        builder.Property(s => s.Status).HasColumnName("status");
    }
}

public class SchoolMembershipConfiguration : IEntityTypeConfiguration<SchoolMembership>
{
    public void Configure(EntityTypeBuilder<SchoolMembership> builder)
    {
        builder.ToTable("school_memberships", "public");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.SchoolId).HasColumnName("school_id");
        builder.Property(m => m.UserId).HasColumnName("user_id");
        builder.Property(m => m.RoleCode).HasColumnName("role_code");
        builder.Property(m => m.Status).HasColumnName("status");
        builder.Property(m => m.GrantedBy).HasColumnName("granted_by");
        builder.Property(m => m.ValidFrom).HasColumnName("valid_from");
        builder.Property(m => m.ValidTo).HasColumnName("valid_to");
        builder.Property(m => m.CreatedAt).HasColumnName("created_at");

        builder.HasOne(m => m.School)
            .WithMany(s => s.Memberships)
            .HasForeignKey(m => m.SchoolId);

        builder.HasOne(m => m.Profile)
            .WithMany(p => p.SchoolMemberships)
            .HasForeignKey(m => m.UserId);

        builder.HasOne(m => m.Role)
            .WithMany(r => r.SchoolMemberships)
            .HasForeignKey(m => m.RoleCode);
    }
}

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("user_sessions", "public");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.UserId).HasColumnName("user_id");
        builder.Property(s => s.RefreshToken).HasColumnName("refresh_token");
        builder.Property(s => s.IpAddress).HasColumnName("ip_address");
        builder.Property(s => s.UserAgent).HasColumnName("user_agent");
        builder.Property(s => s.ExpiresAt).HasColumnName("expires_at");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.RevokedAt).HasColumnName("revoked_at");

        builder.HasOne(s => s.Profile)
            .WithMany(p => p.UserSessions)
            .HasForeignKey(s => s.UserId);
    }
}
