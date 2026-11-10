using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SOMS.Application.Common.Security;
using SOMS.Domain.Entities;

namespace SOMS.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(SomsDbContext context, ILogger logger)
    {
        try
        {
            // 1. Seed Roles nếu chưa có
            if (!await context.Roles.AnyAsync())
            {
                logger.LogInformation("Seeding initial 9 Roles...");
                var roles = new List<Role>
                {
                    new() { Code = RoleCodes.SystemAdmin, NameVi = "Quản trị hệ thống", Description = "Quản trị toàn bộ người dùng, phân quyền RBAC và cấu hình hệ thống" },
                    new() { Code = RoleCodes.SchoolManagement, NameVi = "Ban giám hiệu", Description = "Điều hành toàn diện trường học, phê duyệt thời khóa biểu, đơn từ và báo cáo" },
                    new() { Code = RoleCodes.AcademicAffairs, NameVi = "Giáo vụ", Description = "Quản lý học sinh, lớp học, phân công giảng dạy, thời khóa biểu và thi cử" },
                    new() { Code = RoleCodes.HeadOfDepartment, NameVi = "Tổ trưởng chuyên môn", Description = "Quản lý hoạt động chuyên môn tổ, phân công bài dạy và đề xuất dạy thay" },
                    new() { Code = RoleCodes.Teacher, NameVi = "Giáo viên", Description = "Giảng dạy, ghi nhận điểm danh, nhập sổ điểm điện tử và công tác chủ nhiệm" },
                    new() { Code = RoleCodes.Accountant, NameVi = "Kế toán", Description = "Quản lý thu học phí, công nợ học sinh, đối soát giao dịch ngân hàng" },
                    new() { Code = RoleCodes.FacilityStaff, NameVi = "Nhân viên CSVC", Description = "Quản lý phòng học, cơ sở vật chất, thiết bị dạy học và xử lý sự cố" },
                    new() { Code = RoleCodes.Student, NameVi = "Học sinh", Description = "Tra cứu thời khóa biểu, bảng điểm, lịch thi và điểm danh cá nhân" },
                    new() { Code = RoleCodes.Parent, NameVi = "Phụ huynh", Description = "Theo dõi tình hình học tập của con, nộp đơn xin phép nghỉ và tra cứu học phí" }
                };
                context.Roles.AddRange(roles);
                await context.SaveChangesAsync();
            }

            // 2. Seed Permissions nếu chưa có
            if (!await context.Permissions.AnyAsync())
            {
                logger.LogInformation("Seeding 56 Permissions...");
                var permissions = new List<Permission>
                {
                    // Admin
                    new() { Code = PermissionCodes.UsersRead, Description = "Xem danh sách tài khoản" },
                    new() { Code = PermissionCodes.UsersCreate, Description = "Tạo mới tài khoản người dùng" },
                    new() { Code = PermissionCodes.UsersUpdate, Description = "Cập nhật tài khoản người dùng" },
                    new() { Code = PermissionCodes.UsersDeactivate, Description = "Khóa hoặc mở khóa tài khoản" },
                    new() { Code = PermissionCodes.UsersResetPassword, Description = "Đặt lại mật khẩu người dùng" },
                    new() { Code = PermissionCodes.RolesManage, Description = "Quản lý vai trò và phân quyền" },
                    new() { Code = PermissionCodes.SystemConfigure, Description = "Cấu hình hệ thống" },
                    new() { Code = PermissionCodes.AuditLogsRead, Description = "Xem nhật ký kiểm toán" },
                    new() { Code = PermissionCodes.HealthView, Description = "Xem tình trạng hệ thống" },
                    new() { Code = PermissionCodes.SchoolConfigure, Description = "Cấu hình trường và năm học" },

                    // BGH
                    new() { Code = PermissionCodes.OperationsView, Description = "Xem vận hành toàn trường" },
                    new() { Code = PermissionCodes.AnalyticsView, Description = "Xem báo cáo phân tích" },
                    new() { Code = PermissionCodes.AcademicPlansReview, Description = "Duyệt kế hoạch giảng dạy" },
                    new() { Code = PermissionCodes.TimetablesApprove, Description = "Phê duyệt thời khóa biểu" },
                    new() { Code = PermissionCodes.LeaveRequestsApprove, Description = "Phê duyệt đơn nghỉ phép" },
                    new() { Code = PermissionCodes.FacilitiesApprovePurchase, Description = "Phê duyệt mua sắm CSVC" },
                    new() { Code = PermissionCodes.FinanceSummaryView, Description = "Xem tổng hợp tài chính" },
                    new() { Code = PermissionCodes.WorkflowApprove, Description = "Thẩm quyền phê duyệt hồ sơ" },
                    new() { Code = PermissionCodes.SchedulingApprove, Description = "Phê duyệt đổi tiết, dạy thay" }
                };
                context.Permissions.AddRange(permissions);
                await context.SaveChangesAsync();

                // Gán quyền cho Admin
                var adminPerms = permissions.Select(p => new RolePermission
                {
                    RoleCode = RoleCodes.SystemAdmin,
                    PermissionCode = p.Code
                });
                context.RolePermissions.AddRange(adminPerms);

                // Gán quyền cho BGH
                var bghPermCodes = new[]
                {
                    PermissionCodes.OperationsView,
                    PermissionCodes.AnalyticsView,
                    PermissionCodes.AcademicPlansReview,
                    PermissionCodes.TimetablesApprove,
                    PermissionCodes.LeaveRequestsApprove,
                    PermissionCodes.FacilitiesApprovePurchase,
                    PermissionCodes.FinanceSummaryView,
                    PermissionCodes.WorkflowApprove,
                    PermissionCodes.SchedulingApprove
                };
                context.RolePermissions.AddRange(bghPermCodes.Select(code => new RolePermission
                {
                    RoleCode = RoleCodes.SchoolManagement,
                    PermissionCode = code
                }));

                await context.SaveChangesAsync();
            }

            // 3. Seed Trường mẫu nếu chưa có
            var school = await context.Schools.FirstOrDefaultAsync();
            if (school == null)
            {
                logger.LogInformation("Seeding default School...");
                school = new School
                {
                    Id = Guid.Parse("a0000000-0000-0000-0000-000000000001"),
                    Code = "SOMS-HN-001",
                    Name = "Trường THPT Chuyên Thực Nghiệm SOMS",
                    Level = "THPT",
                    Email = "contact@soms.edu.vn",
                    Phone = "024.3856.9999",
                    Address = "Số 50 Đường Liễu Giai, Ba Đình, Hà Nội",
                    Status = "active"
                };
                context.Schools.Add(school);
                await context.SaveChangesAsync();
            }

            // 4. Seed Niên khóa & Học kỳ nếu chưa có
            if (!await context.AcademicYears.AnyAsync())
            {
                logger.LogInformation("Seeding Academic Year 2025-2026...");
                var year = new AcademicYear
                {
                    Id = Guid.Parse("b0000000-0000-0000-0000-000000000001"),
                    SchoolId = school.Id,
                    Code = "2025-2026",
                    Name = "Năm học 2025 - 2026",
                    StartDate = new DateOnly(2025, 9, 1),
                    EndDate = new DateOnly(2026, 5, 31),
                    IsActive = true,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                year.Semesters.Add(new Semester
                {
                    Id = Guid.NewGuid(),
                    AcademicYearId = year.Id,
                    Code = "HK1",
                    Name = "Học kỳ 1",
                    TermNumber = 1,
                    StartDate = new DateOnly(2025, 9, 1),
                    EndDate = new DateOnly(2026, 1, 15),
                    IsCurrent = true,
                    CreatedAt = DateTimeOffset.UtcNow
                });

                year.Semesters.Add(new Semester
                {
                    Id = Guid.NewGuid(),
                    AcademicYearId = year.Id,
                    Code = "HK2",
                    Name = "Học kỳ 2",
                    TermNumber = 2,
                    StartDate = new DateOnly(2026, 1, 16),
                    EndDate = new DateOnly(2026, 5, 31),
                    IsCurrent = false,
                    CreatedAt = DateTimeOffset.UtcNow
                });

                context.AcademicYears.Add(year);
                await context.SaveChangesAsync();
            }

            // 5. Seed Approval Requests mẫu nếu chưa có
            if (!await context.ApprovalRequests.AnyAsync())
            {
                logger.LogInformation("Seeding sample Approval Requests (BF04)...");
                var requester = await context.Profiles.FirstOrDefaultAsync();
                var requesterId = requester?.Id ?? Guid.Parse("d0000000-0000-0000-0000-000000000001");

                if (requester == null)
                {
                    requester = new Profile
                    {
                        Id = requesterId,
                        FullName = "Nguyễn Văn Thầy (Giáo viên)",
                        Phone = "0988112233",
                        Status = "active"
                    };
                    context.Profiles.Add(requester);
                    await context.SaveChangesAsync();
                }

                var r1 = new ApprovalRequest
                {
                    Id = Guid.NewGuid(),
                    SchoolId = school.Id,
                    RequestCode = "REQ-2026-0001",
                    RequestType = "leave_teacher",
                    RequesterId = requesterId,
                    Title = "Đơn xin nghỉ phép vì lý do gia đình (2 ngày)",
                    Description = "Tôi xin phép nghỉ ngày 12/11 và 13/11. Đã bàn giao giáo án và trao đổi dạy thay với thầy Trần Văn Bình (Tổ Toán).",
                    Priority = "medium",
                    Status = "pending",
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
                    UpdatedAt = DateTimeOffset.UtcNow.AddHours(-3)
                };
                r1.ApprovalHistories.Add(new ApprovalHistory
                {
                    Id = Guid.NewGuid(),
                    RequestId = r1.Id,
                    Action = "created",
                    PerformedBy = requesterId,
                    Note = "Khởi tạo đơn xin nghỉ phép.",
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-3)
                });

                var r2 = new ApprovalRequest
                {
                    Id = Guid.NewGuid(),
                    SchoolId = school.Id,
                    RequestCode = "REQ-2026-0002",
                    RequestType = "timetable_change",
                    RequesterId = requesterId,
                    Title = "Đề xuất đổi tiết 3 sang tiết 5 môn Toán lớp 10A1",
                    Description = "Do lịch kiểm tra chuyên môn của tổ đột xuất, đề nghị chuyển tiết 3 sáng thứ Năm sang tiết 5 cùng ngày.",
                    Priority = "high",
                    Status = "pending",
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-6),
                    UpdatedAt = DateTimeOffset.UtcNow.AddHours(-6)
                };
                r2.ApprovalHistories.Add(new ApprovalHistory
                {
                    Id = Guid.NewGuid(),
                    RequestId = r2.Id,
                    Action = "created",
                    PerformedBy = requesterId,
                    Note = "Tạo đề xuất đổi tiết.",
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-6)
                });

                var r3 = new ApprovalRequest
                {
                    Id = Guid.NewGuid(),
                    SchoolId = school.Id,
                    RequestCode = "REQ-2026-0003",
                    RequestType = "facility_purchase",
                    RequesterId = requesterId,
                    Title = "Đề xuất bổ sung 03 máy chiếu đa năng phục vụ kỳ thi",
                    Description = "Phòng máy số 2 và phòng 304 hiện máy chiếu đã quá cũ mờ, đề nghị BGH phê duyệt ngân sách thay thế.",
                    Priority = "urgent",
                    Status = "pending",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1)
                };
                r3.ApprovalHistories.Add(new ApprovalHistory
                {
                    Id = Guid.NewGuid(),
                    RequestId = r3.Id,
                    Action = "created",
                    PerformedBy = requesterId,
                    Note = "Đề xuất trang thiết bị mới.",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
                });

                context.ApprovalRequests.AddRange(new[] { r1, r2, r3 });
                await context.SaveChangesAsync();
            }

            // 6. Seed School Tasks mẫu nếu chưa có
            if (!await context.SchoolTasks.AnyAsync())
            {
                logger.LogInformation("Seeding sample School Tasks (BF08)...");
                var creator = await context.Profiles.FirstOrDefaultAsync();
                var creatorId = creator?.Id ?? Guid.NewGuid();

                var t1 = new SchoolTask
                {
                    Id = Guid.NewGuid(),
                    SchoolId = school.Id,
                    Title = "Hoàn tất ma trận và đề kiểm tra giữa kỳ 1",
                    Description = "Yêu cầu các Tổ trưởng chuyên môn nộp bản in đề thi và đáp án biểu điểm về BGH trước ngày 15/11.",
                    Category = "academic",
                    Priority = "high",
                    Status = "in_progress",
                    CreatedBy = creatorId,
                    DueDate = DateTimeOffset.UtcNow.AddDays(5),
                    CreatedAt = DateTimeOffset.UtcNow
                };
                t1.Assignments.Add(new TaskAssignment
                {
                    Id = Guid.NewGuid(),
                    TaskId = t1.Id,
                    AssigneeId = creatorId,
                    RoleInTask = "owner",
                    ProgressPercent = 60,
                    AssignedAt = DateTimeOffset.UtcNow
                });

                var t2 = new SchoolTask
                {
                    Id = Guid.NewGuid(),
                    SchoolId = school.Id,
                    Title = "Kiểm tra an toàn điện và phòng cháy chữa cháy tòa nhà B",
                    Description = "Bộ phận cơ sở vật chất tiến hành rà soát bình chữa cháy, ổ cắm điện và tủ kỹ thuật phòng tin học.",
                    Category = "facility",
                    Priority = "urgent",
                    Status = "not_started",
                    CreatedBy = creatorId,
                    DueDate = DateTimeOffset.UtcNow.AddDays(2),
                    CreatedAt = DateTimeOffset.UtcNow
                };
                t2.Assignments.Add(new TaskAssignment
                {
                    Id = Guid.NewGuid(),
                    TaskId = t2.Id,
                    AssigneeId = creatorId,
                    RoleInTask = "owner",
                    ProgressPercent = 0,
                    AssignedAt = DateTimeOffset.UtcNow
                });

                context.SchoolTasks.AddRange(new[] { t1, t2 });
                await context.SaveChangesAsync();
            }

            // 7. Seed Audit Logs mẫu nếu chưa có
            if (!await context.AuditLogs.AnyAsync())
            {
                logger.LogInformation("Seeding initial Audit Logs...");
                context.AuditLogs.AddRange(new[]
                {
                    new AuditLog
                    {
                        Id = Guid.NewGuid(),
                        SchoolId = school.Id,
                        Action = "SYSTEM_INITIALIZE",
                        EntityName = "Database",
                        Details = "Khởi tạo cấu hình ban đầu hệ thống SOMS v1.0",
                        CreatedAt = DateTimeOffset.UtcNow.AddDays(-2)
                    },
                    new AuditLog
                    {
                        Id = Guid.NewGuid(),
                        SchoolId = school.Id,
                        Action = "UPDATE_ACADEMIC_YEAR",
                        EntityName = "AcademicYear",
                        Details = "Thiết lập năm học 2025-2026 làm niên khóa hiện hành",
                        CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
                    }
                });
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "DbInitializer warning: Data seeding encountered an exception (possibly tables exist or read-only connection). Continuing application startup.");
        }
    }
}

