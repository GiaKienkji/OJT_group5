# M0 Academic Affairs

Phạm vi của M0 gồm mapping, hợp đồng liên nhóm, chiến lược migration và kiểm chứng trên PostgreSQL tách biệt. Đối chiếu theo Bước 0 và bảng lộ trình của kế hoạch TV2.

| Hạng mục | Kết quả ngày 18/11/2026 |
|---|---|
| Project và mapping | Đã đọc catalog `jaivisftvckbaxnnzhbi` qua Supabase MCP. 74 bảng thường trong `public`. [Mapping và ERD theo FK](schema-mapping.md). |
| Quyền seed | Đã đối chiếu mã role/permission trong DB. [Ma trận quan sát được](permission-snapshot.md). Chất lượng hồ sơ và membership của người dùng chưa khảo sát. |
| Grant và RLS | Đã đối chiếu grant, policy và cờ RLS. Role MCP là `postgres` có `BYPASSRLS`. Kiểm thử với dữ liệu giả trên PostgreSQL tách biệt đã đạt các ca `anon`, `authenticated` và `service_role`. Ngày 19/11/2026 đo qua kết nối `SomsDbContext` với Shared Pooler: principal hiệu lực `postgres`, có `BYPASSRLS`. [Kết quả](M1-M2-verification.md). |
| Nguồn migration | MCP trả migration history rỗng, catalog không thấy bảng lịch sử EF/Supabase trong phạm vi truy vấn, repo chưa có cây migration được Git theo dõi. Đề xuất SQL Supabase làm nguồn duy nhất, chờ nhóm chốt. |
| Môi trường thử | Đã dựng PostgreSQL 17.12 cục bộ, kiểm tra grant/RLS, diff và rollback bằng fixture 9 bảng tạo từ catalog. Đã kiểm tra cấu hình runtime qua Shared Pooler. Đã khôi phục app baseline 78 bảng và diễn tập hai migration trên PostgreSQL riêng. [Bằng chứng và runbook](M0-postgres-verification.md). |
| Xác nhận nhóm | Các quyết định bên dưới là đề xuất. Phân công TV1/TV3/TV5, danh tính runtime, quy tắc nghiệp vụ và nguồn migration cần người sở hữu xác nhận. |

## Đề xuất liên nhóm ở thời điểm M0

Nhóm chưa có hợp đồng riêng. Bản hiện tại dùng các mặc định trong [runbook triển khai](README.md). Các đề xuất M0 dưới đây được giữ làm ghi chú thiết kế.

### TV1 · Danh tính, quyền, workflow và audit

- Chủ thể request là `profiles.id` từ JWT đã xác thực. `profiles.id → auth.users.id`. Actor lấy từ server. SchoolId từ client chỉ dùng để chọn phạm vi khi membership tại trường đó có quyền tương ứng. Một trường hợp lệ có thể chọn mặc định, nhiều trường yêu cầu lựa chọn tường minh.
- Kiểm tra membership `active`, trường `active`, và `valid_from ≤ ngày địa phương ≤ valid_to`, mốc NULL là không giới hạn. Dùng `schools.timezone`. Kiểm tra quyền hiện hành qua `role_permissions` tại request, nhất là thao tác ghi. Mã hiện tại của permission handler có đường tắt chấp nhận claim và đường truy vấn thiếu school/date scope. Bộ điều khiển Academic đang làm dở có lọc trường/ngày/quyền nhưng đang lấy ngày UTC+7 cố định. Chốt cách dùng chung với TV1 trong M1.
- Đề xuất `academic.manage` cho context, năm học, kỳ, khối và dashboard. Quyền này đã có ở cả Giáo vụ và Quản lý trường. API nghiệp vụ yêu cầu quyền chi tiết của mục 6 kế hoạch. Giáo vụ có `timetables.draft` và `timetables.publish`, Quản lý trường có `timetables.approve`. Chốt quyền đọc giáo viên/phòng tối thiểu theo thao tác, điều kiện yêu cầu thêm `students.manage` khi chuyển lớp, quyền portal theo đối tượng và tài khoản demo. Seed hiện tại cho System Admin tập quyền riêng về hệ thống.
- Đề xuất gửi `draft → pending_approval`, ghi quyết định duyệt hoặc từ chối trong workflow. Từ chối trả về `draft`, duyệt gắn với đúng version và revision. Publish kiểm tra lại quyết định, revision và xung đột trong cùng transaction với archive bản cũ. Chốt quyền sửa sau khi gửi, người duyệt, tự duyệt, loại workflow và cách gắn version/revision. Catalog chưa có FK workflow đến version, revision hoặc hiệu lực phiên bản. `workflow_requests.request_type` hiện chưa có loại duyệt thời khóa biểu riêng.
- Chốt đường ghi audit cho publish, chuyển lớp và dạy thay. `audit_logs` có FK trường/actor và trường dữ liệu trước/sau. Xác nhận principal runtime, grant tối thiểu và quan hệ giữa scope của API với RLS cho từng đường kết nối.

### TV3 · Giáo viên, chuyên môn, lịch nghỉ và điểm danh

- `staff.id` là khóa nghiệp vụ GV. `staff.user_id → profiles.id` nối sang danh tính đăng nhập. Kiểm tra staff thuộc trường, `kind = 'teacher'`, hiệu lực `started_on/ended_on`, trạng thái nhân sự và membership áp dụng. Chốt nguồn chuyên môn, định mức tiết, điều kiện GVCN và cách xử lý giáo viên chưa liên kết account.
- Đề xuất nguồn nghỉ GV là `workflow_requests` loại `teacher_leave`, theo `staff_id`, trạng thái được duyệt và khoảng `starts_on/ends_on`. Chốt trạng thái `completed`, cách diễn giải đầu/cuối khoảng, nghỉ một phần ngày, thu hồi nghỉ và nguồn lịch nghỉ chung của trường. Catalog chưa thấy bảng lịch ngày nghỉ chuyên biệt.
- Khóa ca ban đầu gồm `timetable_slots.id + ngày địa phương`. `attendance_sessions.slot_id` có thể NULL. Chốt cách xác định ca khi thiếu slot, quyền hủy/thay khi đã `finalized`, và đồng bộ người dạy thực tế. Exam là sự kiện lịch, assessment/grade theo hợp đồng điểm của TV3. Chốt luồng kiểm tra có nhiều lớp hoặc giám thị.

### TV5 và chủ sở hữu phòng/thông báo · Dữ liệu công bố

- Đề xuất contract lịch theo khoảng ngày với ca gồm version/revision, slot/date, lớp, môn, GV thực tế, phòng, thời điểm bắt đầu/kết thúc và timezone. Học sinh được kiểm tra enrollment có hiệu lực tại ngày ca, phụ huynh được kiểm tra liên kết guardian theo `student_guardians` và quyền `can_view_academics`. Chốt quy tắc xác thực liên kết, hiệu lực ngày rời lớp, truy vấn lịch lịch sử sau khi thay phiên bản, và consumer GV/HS/PH. Các consumer chỉ đọc bản công bố trong scope của chính mình.
- Chốt owner phòng, thời gian bảo trì/khóa phòng, loại phòng và sức chứa. Catalog có `rooms.status`, chưa có lịch khóa phòng theo khoảng giờ xác nhận cho TV2. Chốt owner lịch nghỉ nếu thuộc module khác.
- Chốt consumer của `TimetablePublished`, `SubstitutionAssigned/Cancelled`, `ExamPublished/Cancelled`, `StudentClassChanged`. Envelope đề xuất gồm eventId, schoolId, entityId, revision và occurredAt. Consumer xử lý lặp an toàn. Xác nhận outbox/retry và owner thông báo để lỗi giao nhận độc lập với transaction lịch.

### TV2 · Quyết định nghiệp vụ theo mapping

- Xác nhận archive học sinh, ngày hiệu lực enrollment và biên khi chuyển lớp; kiểm tra cùng trường, năm, kỳ, khối và sức chứa theo các nhánh FK. Lịch sử GVCN, chương trình lớp/kỳ, lịch nghỉ, lịch giữ chỗ và cửa sổ hiệu lực phiên bản cần thiết kế theo hợp đồng đã duyệt.
- Xác nhận nguồn thiếu phân công cho dashboard, phạm vi conflict draft và published, lịch sử khi thay bản công bố, khóa ca dạy thay và điều kiện phục hồi GV gốc. Các trigger/index hiện tại chỉ bao phủ một phần, gồm trùng theo period ID và các unique đã có trong mapping.
- Mỗi quyết định cần ghi người xác nhận, ngày, phương án đã chốt và bằng chứng cập nhật. M0 chỉ đạt đủ điều kiện khi các owner, identity, lifecycle và đường baseline đã được xác nhận, cùng với bằng chứng kiểm thử DB thử.
