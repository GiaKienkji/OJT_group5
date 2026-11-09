using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SOMS.Domain.Entities;

namespace SOMS.Infrastructure.Data.Configurations;

public class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.ToTable("academic_years", "public");
        builder.HasKey(y => y.Id);
        builder.Property(y => y.Id).HasColumnName("id");
        builder.Property(y => y.SchoolId).HasColumnName("school_id");
        builder.Property(y => y.Code).HasColumnName("code");
        builder.Property(y => y.Name).HasColumnName("name");
        builder.Property(y => y.StartDate).HasColumnName("start_date");
        builder.Property(y => y.EndDate).HasColumnName("end_date");
        builder.Property(y => y.IsActive).HasColumnName("is_active");
        builder.Property(y => y.CreatedAt).HasColumnName("created_at");

        builder.HasOne(y => y.School)
            .WithMany()
            .HasForeignKey(y => y.SchoolId);
    }
}

public class SemesterConfiguration : IEntityTypeConfiguration<Semester>
{
    public void Configure(EntityTypeBuilder<Semester> builder)
    {
        builder.ToTable("semesters", "public");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.AcademicYearId).HasColumnName("academic_year_id");
        builder.Property(s => s.Code).HasColumnName("code");
        builder.Property(s => s.Name).HasColumnName("name");
        builder.Property(s => s.TermNumber).HasColumnName("term_number");
        builder.Property(s => s.StartDate).HasColumnName("start_date");
        builder.Property(s => s.EndDate).HasColumnName("end_date");
        builder.Property(s => s.IsCurrent).HasColumnName("is_current");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");

        builder.HasOne(s => s.AcademicYear)
            .WithMany(y => y.Semesters)
            .HasForeignKey(s => s.AcademicYearId);
    }
}

public class ApprovalRequestConfiguration : IEntityTypeConfiguration<ApprovalRequest>
{
    public void Configure(EntityTypeBuilder<ApprovalRequest> builder)
    {
        builder.ToTable("approval_requests", "public");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id");
        builder.Property(r => r.SchoolId).HasColumnName("school_id");
        builder.Property(r => r.RequestCode).HasColumnName("request_code");
        builder.Property(r => r.RequestType).HasColumnName("request_type");
        builder.Property(r => r.RequesterId).HasColumnName("requester_id");
        builder.Property(r => r.Title).HasColumnName("title");
        builder.Property(r => r.Description).HasColumnName("description");
        builder.Property(r => r.PayloadJson).HasColumnName("payload_json");
        builder.Property(r => r.Status).HasColumnName("status");
        builder.Property(r => r.Priority).HasColumnName("priority");
        builder.Property(r => r.CurrentApproverId).HasColumnName("current_approver_id");
        builder.Property(r => r.FinalDecisionAt).HasColumnName("final_decision_at");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(r => r.School)
            .WithMany()
            .HasForeignKey(r => r.SchoolId);

        builder.HasOne(r => r.Requester)
            .WithMany()
            .HasForeignKey(r => r.RequesterId);

        builder.HasOne(r => r.CurrentApprover)
            .WithMany()
            .HasForeignKey(r => r.CurrentApproverId)
            .IsRequired(false);
    }
}

public class ApprovalHistoryConfiguration : IEntityTypeConfiguration<ApprovalHistory>
{
    public void Configure(EntityTypeBuilder<ApprovalHistory> builder)
    {
        builder.ToTable("approval_histories", "public");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasColumnName("id");
        builder.Property(h => h.RequestId).HasColumnName("request_id");
        builder.Property(h => h.Action).HasColumnName("action");
        builder.Property(h => h.PerformedBy).HasColumnName("performed_by");
        builder.Property(h => h.Note).HasColumnName("note");
        builder.Property(h => h.CreatedAt).HasColumnName("created_at");

        builder.HasOne(h => h.Request)
            .WithMany(r => r.ApprovalHistories)
            .HasForeignKey(h => h.RequestId);

        builder.HasOne(h => h.Actor)
            .WithMany()
            .HasForeignKey(h => h.PerformedBy);
    }
}

public class SchoolTaskConfiguration : IEntityTypeConfiguration<SchoolTask>
{
    public void Configure(EntityTypeBuilder<SchoolTask> builder)
    {
        builder.ToTable("school_tasks", "public");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.SchoolId).HasColumnName("school_id");
        builder.Property(t => t.Title).HasColumnName("title");
        builder.Property(t => t.Description).HasColumnName("description");
        builder.Property(t => t.Category).HasColumnName("category");
        builder.Property(t => t.CreatedBy).HasColumnName("created_by");
        builder.Property(t => t.Priority).HasColumnName("priority");
        builder.Property(t => t.Status).HasColumnName("status");
        builder.Property(t => t.DueDate).HasColumnName("due_date");
        builder.Property(t => t.CompletedAt).HasColumnName("completed_at");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");

        builder.HasOne(t => t.School)
            .WithMany()
            .HasForeignKey(t => t.SchoolId);

        builder.HasOne(t => t.Creator)
            .WithMany()
            .HasForeignKey(t => t.CreatedBy);
    }
}

public class TaskAssignmentConfiguration : IEntityTypeConfiguration<TaskAssignment>
{
    public void Configure(EntityTypeBuilder<TaskAssignment> builder)
    {
        builder.ToTable("task_assignments", "public");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.TaskId).HasColumnName("task_id");
        builder.Property(a => a.AssigneeId).HasColumnName("assignee_id");
        builder.Property(a => a.RoleInTask).HasColumnName("role_in_task");
        builder.Property(a => a.ProgressPercent).HasColumnName("progress_percent");
        builder.Property(a => a.Note).HasColumnName("note");
        builder.Property(a => a.AssignedAt).HasColumnName("assigned_at");

        builder.HasOne(a => a.Task)
            .WithMany(t => t.Assignments)
            .HasForeignKey(a => a.TaskId);

        builder.HasOne(a => a.Assignee)
            .WithMany()
            .HasForeignKey(a => a.AssigneeId);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs", "public");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id");
        builder.Property(l => l.SchoolId).HasColumnName("school_id");
        builder.Property(l => l.UserId).HasColumnName("user_id");
        builder.Property(l => l.Action).HasColumnName("action");
        builder.Property(l => l.EntityName).HasColumnName("entity_name");
        builder.Property(l => l.EntityId).HasColumnName("entity_id");
        builder.Property(l => l.Details).HasColumnName("details");
        builder.Property(l => l.IpAddress).HasColumnName("ip_address");
        builder.Property(l => l.UserAgent).HasColumnName("user_agent");
        builder.Property(l => l.CreatedAt).HasColumnName("created_at");

        builder.HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .IsRequired(false);

        builder.HasOne(l => l.School)
            .WithMany()
            .HasForeignKey(l => l.SchoolId)
            .IsRequired(false);
    }
}

