using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SOMS.Domain.Entities;

namespace SOMS.Infrastructure.Data.Configurations;

internal sealed class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.ToTable("academic_years");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.StartDate).HasColumnName("start_date");
        builder.Property(row => row.EndDate).HasColumnName("end_date");
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.SchoolId).HasColumnName("school_id");
        builder.Property(row => row.Name).HasColumnName("name");
        builder.Property(row => row.Status).HasColumnName("status");
        builder.HasOne<School>().WithMany().HasForeignKey(row => row.SchoolId);
    }
}

internal sealed class SemesterConfiguration : IEntityTypeConfiguration<Semester>
{
    public void Configure(EntityTypeBuilder<Semester> builder)
    {
        builder.ToTable("semesters");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.AcademicYearId).HasColumnName("academic_year_id");
        builder.Property(row => row.Name).HasColumnName("name");
        builder.Property(row => row.Ordinal).HasColumnName("ordinal");
        builder.Property(row => row.StartDate).HasColumnName("start_date");
        builder.Property(row => row.EndDate).HasColumnName("end_date");
        builder.Property(row => row.Status).HasColumnName("status");
        builder.HasOne<AcademicYear>().WithMany().HasForeignKey(row => row.AcademicYearId);
    }
}

internal sealed class GradeLevelConfiguration : IEntityTypeConfiguration<GradeLevel>
{
    public void Configure(EntityTypeBuilder<GradeLevel> builder)
    {
        builder.ToTable("grade_levels");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.SchoolId).HasColumnName("school_id");
        builder.Property(row => row.GradeNumber).HasColumnName("grade_number");
        builder.HasOne<School>().WithMany().HasForeignKey(row => row.SchoolId);
    }
}

internal sealed class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("students");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.SchoolId).HasColumnName("school_id");
        builder.Property(row => row.UserId).HasColumnName("user_id");
        builder.Property(row => row.StudentCode).HasColumnName("student_code");
        builder.Property(row => row.FullName).HasColumnName("full_name");
        builder.Property(row => row.DateOfBirth).HasColumnName("date_of_birth");
        builder.Property(row => row.AdmittedOn).HasColumnName("admitted_on");
        builder.Property(row => row.Status).HasColumnName("status");
        builder.Property(row => row.CreatedAt).HasColumnName("created_at");
        builder.Property(row => row.Revision).IsRowVersion();
        builder.HasOne<School>().WithMany().HasForeignKey(row => row.SchoolId);
        builder.HasOne<Profile>().WithMany().HasForeignKey(row => row.UserId);
        builder.HasIndex(row => new { row.SchoolId, row.StudentCode }).IsUnique();
    }
}

internal sealed class SchoolClassConfiguration : IEntityTypeConfiguration<SchoolClass>
{
    public void Configure(EntityTypeBuilder<SchoolClass> builder)
    {
        builder.ToTable("classes");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.SchoolId).HasColumnName("school_id");
        builder.Property(row => row.AcademicYearId).HasColumnName("academic_year_id");
        builder.Property(row => row.GradeLevelId).HasColumnName("grade_level_id");
        builder.Property(row => row.Code).HasColumnName("code");
        builder.Property(row => row.Name).HasColumnName("name");
        builder.Property(row => row.HomeroomStaffId).HasColumnName("homeroom_staff_id");
        builder.Property(row => row.Capacity).HasColumnName("capacity");
        builder.Property(row => row.Status).HasColumnName("status");
        builder.Property(row => row.Revision).IsRowVersion();
        builder.HasOne<AcademicYear>().WithMany().HasForeignKey(row => row.AcademicYearId);
        builder.HasOne<GradeLevel>().WithMany().HasForeignKey(row => row.GradeLevelId);
        builder.HasIndex(row => new { row.AcademicYearId, row.Code }).IsUnique();
        builder.HasOne<School>().WithMany().HasForeignKey(row => row.SchoolId);
    }
}

internal sealed class ClassEnrollmentConfiguration : IEntityTypeConfiguration<ClassEnrollment>
{
    public void Configure(EntityTypeBuilder<ClassEnrollment> builder)
    {
        builder.ToTable("class_enrollments", "public");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.ClassId).HasColumnName("class_id");
        builder.Property(row => row.StudentId).HasColumnName("student_id");
        builder.Property(row => row.EnrolledOn).HasColumnName("enrolled_on");
        builder.Property(row => row.LeftOn).HasColumnName("left_on");
        builder.Property(row => row.Status).HasColumnName("status");
        builder.HasOne<SchoolClass>().WithMany().HasForeignKey(row => row.ClassId);
        builder.HasOne<Student>().WithMany().HasForeignKey(row => row.StudentId);
    }
}

internal sealed class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.ToTable("subjects", "public");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.SchoolId).HasColumnName("school_id");
        builder.Property(row => row.Code).HasColumnName("code");
        builder.Property(row => row.Name).HasColumnName("name");
        builder.Property(row => row.IsActive).HasColumnName("is_active");
        builder.Property(row => row.Revision).IsRowVersion();
        builder.HasOne<School>().WithMany().HasForeignKey(row => row.SchoolId);
    }
}

internal sealed class AcademicStaffConfiguration : IEntityTypeConfiguration<AcademicStaff>
{
    public void Configure(EntityTypeBuilder<AcademicStaff> builder)
    {
        builder.ToTable("staff", "public");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.SchoolId).HasColumnName("school_id");
        builder.Property(row => row.EmployeeCode).HasColumnName("employee_code");
        builder.Property(row => row.FullName).HasColumnName("full_name");
        builder.Property(row => row.Kind).HasColumnName("kind");
        builder.Property(row => row.EmploymentStatus).HasColumnName("employment_status");
        builder.Property(row => row.StartedOn).HasColumnName("started_on");
        builder.Property(row => row.EndedOn).HasColumnName("ended_on");
    }
}

internal sealed class TeachingAssignmentConfiguration : IEntityTypeConfiguration<TeachingAssignment>
{
    public void Configure(EntityTypeBuilder<TeachingAssignment> builder)
    {
        builder.ToTable("teaching_assignments", "public");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.ClassId).HasColumnName("class_id");
        builder.Property(row => row.SubjectId).HasColumnName("subject_id");
        builder.Property(row => row.StaffId).HasColumnName("staff_id");
        builder.Property(row => row.SemesterId).HasColumnName("semester_id");
        builder.Property(row => row.WeeklyPeriods).HasColumnName("weekly_periods");
        builder.Property(row => row.Status).HasColumnName("status");
        builder.Property(row => row.Revision).IsRowVersion();
    }
}

internal sealed class ClassSubjectConfiguration : IEntityTypeConfiguration<ClassSubject>
{
    public void Configure(EntityTypeBuilder<ClassSubject> builder)
    {
        builder.ToTable("academic_class_subjects", "public");
        builder.HasKey(row => new { row.ClassId, row.SemesterId, row.SubjectId });
        builder.Property(row => row.ClassId).HasColumnName("class_id");
        builder.Property(row => row.SemesterId).HasColumnName("semester_id");
        builder.Property(row => row.SubjectId).HasColumnName("subject_id");
        builder.Property(row => row.WeeklyPeriods).HasColumnName("weekly_periods");
    }
}

internal sealed class HomeroomAssignmentConfiguration : IEntityTypeConfiguration<HomeroomAssignment>
{
    public void Configure(EntityTypeBuilder<HomeroomAssignment> builder)
    {
        builder.ToTable("academic_homeroom_assignments", "public");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).HasColumnName("id");
        builder.Property(row => row.ClassId).HasColumnName("class_id");
        builder.Property(row => row.StaffId).HasColumnName("staff_id");
        builder.Property(row => row.StartsOn).HasColumnName("starts_on");
        builder.Property(row => row.EndsBefore).HasColumnName("ends_before");
    }
}
