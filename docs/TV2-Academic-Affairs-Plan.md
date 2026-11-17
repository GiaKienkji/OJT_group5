# Kế hoạch TV2 — Academic Affairs

Ngày lập: 18/11/2026. Người phụ trách: TV2. Dự án: SOMS / OJT_group5.

## 1. Mục tiêu và hiện trạng đã kiểm tra

Bàn giao đầy đủ quản lý hồ sơ học sinh, lớp, môn học, phân công giảng dạy/GVCN, thời khóa biểu nháp, kiểm tra xung đột, dạy thay và lịch kiểm tra. Mỗi chức năng có UI, API, lưu PostgreSQL, validation, phân quyền, kiểm thử và demo.

Hiện trạng source:
- Backend `backend/SOMS.sln`: .NET 8; Api, Application, Domain, Infrastructure; EF Core/Npgsql; JWT và permission policies.
- `SomsDbContext` hiện ánh xạ 7 entity thuộc tài khoản/trường/quyền; chưa có entity TV2 và chưa thấy migration trong cây source đã kiểm tra.
- Có role `academic_affairs`; đã khai báo `students.manage`, `classes.manage`, `subjects.manage`, `teaching_assignments.manage`, `homeroom.assign`, `timetables.draft`, `timetables.publish`, `exams.manage`, `academic.manage`, `scheduling.manage`. Khai báo constant chưa chứng minh dữ liệu quyền đã được seed trên DB.
- Frontend React 18, TypeScript, Vite, Tailwind; `App.tsx` có dashboard Giáo vụ dạng khung. Chưa có module Academic chuyên biệt; package.json chưa có lệnh test UI.
- StudentPortalService tham chiếu SQL tới students, staff, academic_years, semesters, grade_levels, classes, class_enrollments; lịch học có dữ liệu mẫu. Mục 4 đối chiếu các bảng này với catalog Supabase.
- PermissionAuthorizationHandler hiện có nhánh chấp nhận permission claim ngay và nhánh truy vấn membership chưa giới hạn trường/hiệu lực thời gian. Cần phối hợp TV1 bổ sung school scope và xử lý thu hồi quyền.
- Các thư mục Academic.Api, academic-affairs, src chưa có source module TV2 được phát hiện; triển khai trong solution đang hoạt động, tránh tạo backend thứ hai.

Supabase MCP đã xác nhận URL thuộc project `jaivisftvckbaxnnzhbi`. Ngày 18/11/2026, truy vấn catalog PostgreSQL ghi nhận 74 bảng trong `public`, không có view hoặc materialized view trong danh sách đối tượng khảo sát. Mục 4 ghi lại các cột, khóa, chỉ mục, trigger và RLS liên quan trực tiếp đến TV2. Đợt khảo sát chỉ đọc metadata, không truy vấn bản ghi nghiệp vụ.

## 2. Bước 0 — Hoàn thiện mapping và chốt hợp đồng nhóm

- Đã xác minh project và schema qua Supabase MCP. Dùng mapping ở mục 4 làm baseline cho EF Core và lập ERD từ các khóa ngoại thực tế.
- Xác nhận owner TV1/TV3/TV5, hợp đồng quyền, workflow duyệt lịch, lịch nghỉ và nguồn chuyên môn. Giáo viên dùng `staff.id` trong nghiệp vụ, còn danh tính đăng nhập liên kết qua `staff.user_id → profiles.id`.
- Kiểm tra grant và hành vi RLS bằng role runtime trên DB thử. Kiểm tra seed quyền và chất lượng dữ liệu là công việc tiếp theo, ngoài phạm vi khảo sát metadata.
- Chốt một nguồn migration với nhóm. Baseline các bảng đã có và chỉ tạo migration cho phần thiếu sau khi thống nhất. Thử SQL diff, điều kiện triển khai và rollback trên PostgreSQL tách biệt.

## 3. Kiến trúc triển khai

Luồng: React → ASP.NET controller → application service/validator → EF Core/Npgsql → Supabase PostgreSQL.

- Domain: entity và quy tắc nghiệp vụ độc lập HTTP.
- Application: DTO, interfaces, validators, AcademicService, TimetableService, ConflictCheckingService, SubstitutionService, ExamSchedulingService.
- Infrastructure: EF mappings, query/persistence, transaction, migrations, adapter đọc phòng/giáo viên/nghỉ phép và phát sự kiện.
- Api: controller, permission policy, school context, ProblemDetails, OpenAPI.
- UI: `frontend/src/features/academic/{components,pages,services,hooks,types}`; tích hợp AuthContext và cơ chế điều hướng hiện có. Nếu đổi router phải chốt với TV1 để không phá StudentRoutes.
- Unit test trong SOMS.UnitTests; thêm project integration test chạy PostgreSQL thật tách biệt và bộ UI/E2E riêng.

Không dùng dữ liệu mẫu làm fallback khi API/DB lỗi; hiển thị lỗi và cho thử lại. Tiếng Việt UTF-8 nhất quán.

## 4. Schema TV2 trên Supabase và phần cần bổ sung

### 4.1. Mapping các bảng hiện hữu

| Nhóm | Bảng và cột thực tế | Áp dụng cho TV2 |
|---|---|---|
| Trường, năm học, kỳ, khối | `schools.timezone`, `academic_years(school_id, name, start_date, end_date, status)`, `semesters(academic_year_id, ordinal, start_date, end_date, status)`, `grade_levels(school_id, grade_number)` | Kỳ lấy trường qua năm học. Mỗi trường có tối đa một năm học `active`. Khối 6–12, duy nhất theo trường. Kiểm tra ngày học kỳ nằm trong năm học. |
| Học sinh | `students(school_id, user_id, student_code, full_name, date_of_birth, status, admitted_on)` | Mã duy nhất theo trường, `user_id` tùy chọn và tham chiếu `profiles.id`. Trạng thái `enrolled/transferred/graduated/withdrawn`. Chốt thao tác archive theo nghiệp vụ và CHECK hiện có. |
| Lớp và GVCN | `classes(school_id, academic_year_id, grade_level_id, code, name, homeroom_staff_id, capacity, status)` | Mã duy nhất theo năm học. `capacity` cho phép NULL, nếu có phải dương. `homeroom_staff_id → staff.id` lưu GVCN hiện tại. Lịch sử và khoảng hiệu lực cần bổ sung nếu dùng cho AA-06. |
| Ghi danh | `class_enrollments(class_id, student_id, enrolled_on, left_on, status)` | `active/moved/completed`, duy nhất theo lớp, học sinh và ngày vào. Partial unique index giới hạn một dòng `active` mỗi học sinh. Chuyển lớp trong transaction và kiểm tra các khoảng lịch sử chồng lấn. |
| Môn và phân công | `subjects(school_id, code, name, is_active)`, `teaching_assignments(class_id, subject_id, staff_id, semester_id, weekly_periods, status)` | Mã môn duy nhất theo trường. Phân công duy nhất theo bộ bốn FK, số tiết tuần dương, trạng thái `draft/active/inactive`. `weekly_periods` là tải của phân công. Chương trình lớp/kỳ và hiệu lực chi tiết cần thiết kế riêng nếu nghiệp vụ yêu cầu. |
| Giáo viên và quyền | `staff(school_id, user_id, kind, department_id, started_on, ended_on, employment_status)`, `school_memberships(school_id, user_id, role_code, status, valid_from, valid_to)` | Lọc `kind = 'teacher'` theo trường và hiệu lực nhân sự. Đối chiếu membership qua `profiles.id`, `roles`, `role_permissions` và `permissions`. Chốt nguồn chuyên môn và quy trình nghỉ GV với TV3, có thể dùng `workflow_requests` loại `teacher_leave` theo `staff_id` và khoảng ngày. |
| Phòng và tiết | `rooms(school_id, code, room_type, capacity, status)`, `period_definitions(school_id, period_no, shift, starts_at, ends_at)` | Phòng `available/maintenance/closed`, capacity có thể NULL. Tiết dùng giờ địa phương, có CHECK thứ tự giờ và unique theo trường, buổi, số tiết. Dùng `schools.timezone` (mặc định `Asia/Ho_Chi_Minh`) để suy ra thời điểm ca cụ thể. |
| Phiên bản và ô lịch | `timetable_versions(semester_id, version_no, status, created_by, published_at)`, `timetable_slots(version_id, teaching_assignment_id, room_id, weekday, period_id)` | Một slot tương ứng một tiết, `weekday` từ 1 đến 7. `room_id` bắt buộc. `version_no` duy nhất trong kỳ và kỳ có tối đa một bản `published`. Tên `entries` có thể giữ ở API và map xuống `timetable_slots`. |
| Dạy thay | `substitutions(request_id, original_slot_id, on_date, substitute_staff_id, confirmed_by, status)` | Khóa nghiệp vụ `original_slot_id + on_date`. GV gốc lấy qua slot → phân công → `staff.id`. `request_id` tùy chọn trỏ `schedule_change_requests`. |
| Kiểm tra | `exam_schedules(class_id, subject_id, semester_id, starts_at, ends_at, room_id, status)` | Một lớp mỗi dòng, phòng tùy chọn, hai mốc `timestamptz` có CHECK thứ tự, trạng thái `draft/published/cancelled`. Ca nhiều lớp hoặc giám thị cần bổ sung liên kết theo hợp đồng nhóm. `assessments/grades` phục vụ đánh giá và điểm. |
| Điểm danh, duyệt và audit | `attendance_sessions(teaching_assignment_id, slot_id, session_date, status)`, `workflow_requests`, `approval_steps`, `workflow_events`, `audit_logs` | Điểm danh `draft/finalized`, `slot_id` tùy chọn. Chốt khóa ca với TV3. Workflow chung có bước duyệt nhưng chưa có FK gắn phiên bản lịch. Audit hiện có nhận `school_id`, `actor_id`, `table_name`, `row_id`, `operation` và dữ liệu trước/sau. |

Các bảng con như `class_enrollments`, `teaching_assignments`, `timetable_slots`, `substitutions` và `exam_schedules` lấy phạm vi trường qua các FK. API cần xác thực tất cả nhánh tham chiếu về cùng trường và kỳ. Khi bổ sung constraint hoặc index, đánh giá dữ liệu cũ trên DB thử trước.

### 4.2. Ràng buộc hiện có và khoảng trống

- `timetable_slots` có unique theo phiên bản, ngày trong tuần, tiết và phòng hoặc phân công. `tr_slots_draft` kiểm tra phiên bản đích khi thêm/sửa và phiên bản cũ khi xóa. API khóa cả hai phiên bản hoặc cấm đổi `version_id` khi sửa.
- `tr_timetable_publish` chạy khi UPDATE sang `published`, kiểm tra liên kết kỳ/trường/phòng/tiết, trùng GV và lớp theo cùng `period_id`, rồi đặt `published_at`. API phải kiểm tra chồng lấn theo giờ thực, giữa các period khác ID, giữa lịch tuần, dạy thay và kiểm tra, đồng thời khóa tài nguyên lúc ghi.
- Chưa có bảng lịch theo ngày/giữ chỗ tập trung, lịch ngày nghỉ, thời gian khóa phòng, chương trình lớp/kỳ hay lịch sử GVCN chuyên biệt. Dùng slot + ngày làm khóa ca nghiệp vụ ban đầu, rồi chốt với TV3/TV5 việc suy diễn ca hoặc bổ sung dữ liệu theo ngày để giữ lịch sử và đồng bộ portal.
- Bảng TV2 trong mapping có RLS bật và FORCE RLS tắt. Policy của phiên bản, slot và lịch kiểm tra chỉ đọc dữ liệu `published` với kiểm tra trường/lớp tương ứng. Các bảng `rooms`, `staff`, `substitutions`, `schedule_change_requests`, `school_memberships` và `audit_logs` chưa có policy trong snapshot. API ASP.NET phải kiểm tra quyền và school scope theo role runtime thực tế. Kiểm thử riêng nếu dùng PostgREST.

## 5. Backlog chức năng và tiêu chí nghiệm thu

| ID | Công việc UI/API | Validation/nghiệm thu |
|---|---|---|
| AA-01 | Dashboard: sĩ số, lớp, phân công thiếu, lịch nháp/xung đột, ca cần thay | Số liệu từ DB, lọc trường/năm học/học kỳ; có loading/empty/error |
| AA-02 | Danh sách, tìm kiếm, phân trang, tạo/sửa/xem/archive học sinh | Mã không trùng; ngày sinh không tương lai; profile cùng trường; không lộ dữ liệu ngoài scope |
| AA-03 | CRUD lớp, xem sĩ số/danh sách, xếp/chuyển lớp | Kiểm tra capacity và khối; chuyển lớp trong transaction; giữ enrollment cũ và không chồng hiệu lực |
| AA-04 | CRUD môn và chương trình lớp/học kỳ | Mã chuẩn hóa không trùng; số tiết hợp lệ; không xóa môn đã có phân công/lịch |
| AA-05 | Phân công GV theo lớp/môn/học kỳ | GV active, đúng trường/chuyên môn, hiệu lực hợp lệ; cảnh báo hoặc chặn vượt định mức theo quy tắc nhóm chốt |
| AA-06 | Phân công/thay GVCN | Không có hai GVCN chính đồng thời; không mất lịch sử; chỉ sửa bằng quyền homeroom.assign |
| AA-07 | Tạo/nhân bản lịch nháp; thêm/sửa/xóa ô lịch; xem theo lớp/GV/phòng | Nhân bản tạo ID/revision mới; lưu DB; edit bằng form là bắt buộc, kéo thả là cải tiến |
| AA-08 | Kiểm tra xung đột một ô/toàn phiên bản và gợi ý ô/GV/phòng hợp lệ | Chỉ rõ loại lỗi, ngày/tiết, tài nguyên và bản ghi liên quan; không chỉ trả true/false |
| AA-09 | Gửi duyệt, duyệt/từ chối, công bố lịch | Đúng quyền/trạng thái/revision; kiểm tra lại tại commit; HS/GV chỉ thấy lịch đã công bố |
| AA-10 | Danh sách ca cần thay, tìm GV rảnh, bố trí/hủy dạy thay | GV thay đủ điều kiện; kiểm tra lịch/nghỉ phép; chỉ đổi session đích; trả lại GV gốc nếu hủy hợp lệ |
| AA-11 | CRUD lịch kiểm tra, lớp/phòng/giám thị, công bố/hủy | Chống trùng lớp/phòng/GV với cả lịch học và dạy thay; thời lượng, capacity và kỳ hợp lệ |
| AA-12 | Đồng bộ lịch thật tới portal GV/HS và lịch sử thay đổi | Sửa/công bố/dạy thay phản ánh đúng ngày; dữ liệu draft không lộ; không trả mock khi DB lỗi |

## 6. API contract dự kiến

Prefix `/api/academic`; tài nguyên luôn được lọc theo trường được server xác thực. SchoolId client truyền chỉ là yêu cầu chọn trường, không phải bằng chứng quyền. DTO ghi không cho client tự đặt actor, trạng thái duyệt hoặc SchoolId tùy ý.

| Tài nguyên | Endpoint chính | Quyền |
|---|---|---|
| Ngữ cảnh | GET /context; GET /academic-years; GET /semesters; GET /grade-levels | Quyền đọc Academic được nhóm thống nhất |
| Học sinh | GET/POST /students; GET/PUT /students/{id}; POST /students/{id}/archive | students.manage |
| Lớp/enrollment | GET/POST /classes; GET/PUT /classes/{id}; GET/POST /classes/{id}/enrollments; POST /enrollments/{id}/transfer | classes.manage; chuyển lớp yêu cầu cả quyền quản lý học sinh nếu nhóm thống nhất |
| Môn | GET/POST /subjects; GET/PUT /subjects/{id}; PUT /classes/{id}/subjects | subjects.manage |
| GV/phòng | GET /teachers; GET /rooms; GET /teachers/{id}/availability | Quyền đọc tối thiểu; dữ liệu và quyền lấy từ module sở hữu |
| Phân công | GET/POST /teaching-assignments; PUT /teaching-assignments/{id}; POST /teaching-assignments/{id}/archive | teaching_assignments.manage |
| GVCN | GET/POST /classes/{id}/homeroom-assignments | homeroom.assign |
| Lịch nháp | GET/POST /timetables; GET /timetables/{id}; POST /timetables/{id}/clone; POST/PUT/DELETE /timetables/{id}/entries[/{entryId}] | timetables.draft |
| Xung đột | POST /timetables/{id}/validate; POST /scheduling/check-conflicts; GET /scheduling/suggestions | timetables.draft hoặc scheduling.manage theo thao tác |
| Vòng đời lịch | POST /timetables/{id}/submit, /approve, /reject, /publish | draft để gửi; timetables.approve để duyệt; timetables.publish để công bố |
| Lịch công bố | GET /schedule?from=&to=&classId=&teacherId=&roomId= | Quyền xem theo vai trò và phạm vi đối tượng |
| Dạy thay | GET/POST /substitutions; POST /substitutions/{id}/cancel; GET /sessions/{id}/substitute-candidates | scheduling.manage; thêm substitutions.manage chỉ khi nhóm quyết định |
| Kiểm tra | GET/POST /exams; GET/PUT /exams/{id}; POST /exams/{id}/publish, /cancel | exams.manage |

Các permission đọc/approval phải đối chiếu DB và seed/mapping role của TV1; không tự mở endpoint cho mọi user đã login. Quyền xem portal học sinh/giáo viên tiếp tục dùng quyền hiện có và scope riêng.

Quy ước: pagination giới hạn pageSize; lọc/sort whitelist; 201 cho tạo, 400 cho input sai, 401/403 cho auth/quyền, 404 cho tài nguyên không nằm trong scope, 409 cho xung đột lịch/mã trùng/revision cũ. ProblemDetails chứa code, fieldErrors/conflicts, traceId, không trả SQL/PII. PATCH/PUT sử dụng revision hoặc If-Match; publish cần idempotency key hoặc kiểm tra trạng thái chống gửi lặp. OpenAPI có ví dụ request/response và collection demo.

## 7. Scheduling & Conflict Checking

Quy tắc cứng:
1. Một GV thực tế không dạy/coi kiểm tra hai ca chồng thời gian.
2. Một lớp không có hai hoạt động chồng thời gian, kể cả kiểm tra và dạy thay.
3. Một phòng không bị hai lịch chiếm chồng thời gian; không dùng phòng khóa/bảo trì; đủ capacity/loại phòng.
4. GV có phân công/chuyên môn hợp lệ, không nghỉ được duyệt và còn membership hiệu lực; dữ liệu cùng trường, kỳ và khoảng hiệu lực.
5. Lịch nằm trong ngày học/khung giờ hợp lệ, không vượt kỳ; ngoại lệ ngày nghỉ và thay đổi theo ngày được áp dụng trước khi kiểm tra.
6. Bản nháp được kiểm tra nội bộ và với lịch đã công bố liên quan; hai bản nháp thay thế nhau không tự động chặn lẫn nhau. Phạm vi phiên bản được ghi rõ và recheck khi publish.

Quy tắc mềm: thiếu/thừa số tiết môn, tải GV, nhiều tiết liên tiếp, khoảng trống lịch. Đánh dấu warning riêng; thiếu dữ liệu bắt buộc có thể thành lỗi cứng theo chính sách chốt với nhóm.

Thuật toán: chuẩn hóa input → resolve assignment/hiệu lực/ngoại lệ → materialize các ngày cần xét → query candidate theo SchoolId và khoảng ngày → so sánh `a.Start < b.End && b.Start < a.End` cho từng tài nguyên → trả danh sách conflict có mã ổn định (TEACHER_BUSY, CLASS_BUSY, ROOM_BUSY, TEACHER_UNAVAILABLE...). Khi sửa, loại đúng bản ghi đang sửa, vẫn xét các bản ghi còn lại trong request batch. Bản kiểm tra preview không thay thế kiểm tra lúc ghi.

Chống race: kiểm tra và ghi trong transaction; khóa tài nguyên/ngày theo thứ tự cố định hoặc dùng isolation phù hợp và retry có giới hạn. Đề xuất bảng resource reservations dùng PostgreSQL exclusion constraint trên SchoolId, ResourceType, ResourceId và tstzrange cho các session đang chiếm chỗ; xác minh extension/quyền trước khi chọn. Cả học, kiểm tra và dạy thay phải đi qua cùng cơ chế đặt tài nguyên. Hai request đồng thời chỉ một request được chiếm tài nguyên; request còn lại nhận 409.

Lập lịch tối thiểu: người dùng xếp thủ công có kiểm tra và gợi ý candidate hợp lệ, không cam kết tối ưu toàn trường. Nếu bổ sung auto-generation: greedy/backtracking giới hạn thời gian, ưu tiên môn/GV/phòng bị ràng buộc nhiều; trả các tiết chưa xếp cùng lý do và vẫn validate kết quả. Không tự công bố kết quả tự sinh.

## 8. Vòng đời, dạy thay và quyền

Phiên bản lịch: `draft → pending_approval → published → archived` là các trạng thái DB dùng cho luồng đề xuất. Khi từ chối, ghi quyết định theo workflow/audit và trả phiên bản về `draft`. Kết quả duyệt cần gắn đúng phiên bản và nội dung được duyệt trước khi công bố. DB hiện có `created_by`, `version_no`, `published_at`, chưa có cột revision, người duyệt hoặc khoảng hiệu lực. Chốt cơ chế lưu quyết định/revision với TV1. Với unique một bản công bố mỗi kỳ, archive bản cũ rồi chuyển bản mới sang `published` trong cùng transaction. Muốn tra lịch lịch sử theo ngày, cần bổ sung mapping hiệu lực hoặc dữ liệu ca theo ngày.

Dạy thay: xác định ca bằng `original_slot_id + on_date`, đọc GV gốc từ phân công và kiểm tra lịch/nghỉ phép của GV thay. Dùng trạng thái `proposed/confirmed/cancelled/completed`. Khi xác nhận, kiểm tra lại xung đột và ghi audit cùng thay đổi giữ chỗ nếu có. Giữ lớp/phòng của slot nguồn. Khi hủy, kiểm tra khả năng khôi phục GV gốc và cập nhật dòng hiện có theo unique của ca. Chốt với TV3 quy tắc khóa ca đã điểm danh qua `attendance_sessions.slot_id + session_date` và cách xử lý bản ghi thiếu slot.

Quyền:
- Academic Affairs thao tác dữ liệu trường được phân công và các quyền chi tiết tương ứng.
- School Management duyệt lịch trong trường; công bố theo quyền riêng.
- Teacher chỉ đọc lịch/phân công của mình và dữ liệu lớp được giao; không sửa lịch chung.
- Student chỉ đọc dữ liệu/lịch công bố của lớp có enrollment hiệu lực tại ngày xem; Parent chỉ xem con đã liên kết hợp lệ.
- System Admin không mặc nhiên được mọi quyền nghiệp vụ trừ khi policy của TV1 quy định.

Phải kiểm tra membership active, ValidFrom/ValidTo và SchoolId tại mỗi request ghi; không chỉ dựa permission claim cũ. Frontend ẩn nút không thay thế authorization API. Xác định DB role runtime: kết nối owner/service role có thể bypass RLS, vì vậy API scope bắt buộc; nếu có truy cập PostgREST trực tiếp thì cần RLS tương ứng và kiểm thử bằng chính role/JWT đó. Không dùng khóa service role trong frontend.

## 9. UI bàn giao

Điều hướng: Tổng quan; Học sinh; Lớp học; Môn học; Phân công giảng dạy; GVCN; Thời khóa biểu; Dạy thay; Lịch kiểm tra.

Màn hình chung có bộ lọc năm học/học kỳ, tìm kiếm, phân trang, form tạo/sửa, trạng thái lưu, lỗi từng field, xác nhận thao tác ảnh hưởng lịch sử, thông báo thành công và retry. Các trang chi tiết hiển thị dữ liệu liên quan và lịch sử thay đổi cần thiết.

Timetable hiển thị lưới thứ/tiết, chọn tuần/lớp/GV/phòng, badge version/status, panel chi tiết ô, danh sách conflict có liên kết tới ô, nút lưu/gửi duyệt/công bố theo quyền. Cảnh báo khi đổi trang còn dữ liệu chưa lưu. Dạy thay và kiểm tra có calendar/list và form chọn tài nguyên chỉ hiển thị candidate phù hợp; server vẫn revalidate.

## 10. Phối hợp TV1, TV3, TV5

Chưa xác minh phạm vi từng thành viên ngoài TV2; bảng sau là hợp đồng đề xuất, phải xác nhận chủ sở hữu bước 0.

| Bên | Nội dung cần thống nhất | Đầu ra |
|---|---|---|
| TV1 | Auth/JWT, school context, permission seed, membership/thu hồi quyền, người duyệt, audit chung | Policy matrix, school-scoped identity contract và tài khoản demo |
| TV3 | Staff/chuyên môn, nghỉ phép, lịch GV, điểm danh, dữ liệu kiểm tra so với dữ liệu điểm | Staff/leave contract; session ID dùng chung; quy tắc khóa ca đã điểm danh |
| TV5 | Consumer lịch HS/PH và/hoặc nguồn phòng/thông báo theo phân công thực tế | DTO lịch công bố, enrollment hiệu lực, room availability, sự kiện thay đổi |

Nếu phòng/workflow/thông báo do người khác sở hữu thì chuyển hợp đồng đó đúng thành viên; TV2 vẫn phụ trách adapter và kiểm thử tích hợp. Các sự kiện đề xuất: TimetablePublished, SubstitutionAssigned/Cancelled, ExamPublished/Cancelled, StudentClassChanged; có eventId, SchoolId, entityId, revision, occurredAt và xử lý lặp an toàn. Lỗi gửi thông báo không được làm mất lịch đã lưu; dùng outbox nếu nhóm có hạ tầng hoặc cơ chế retry được chốt.

## 11. Kế hoạch kiểm thử

| Tầng | Trường hợp bắt buộc |
|---|---|
| Unit Academic | Mã trùng/chuẩn hóa, ngày sai, capacity, chuyển lớp giữ lịch sử, hiệu lực assignment/GVCN, tài nguyên khác trường |
| Unit Scheduling | Trùng GV/lớp/phòng; khoảng tiếp giáp; nhiều tiết; khác ngày; kỳ/hiệu lực không giao nhau; ngày nghỉ; sửa loại bản thân; batch tự trùng; draft vs published |
| Unit Substitution/Exam | GV thay nghỉ/bận/sai chuyên môn; đổi/hủy đúng session; khôi phục không hợp lệ; exam vs lesson/substitution; nhiều lớp/giám thị |
| Integration PostgreSQL | Apply baseline+migration trên DB thử; FK/unique/check/exclusion; rollback; optimistic concurrency; hai request đặt cùng slot; dữ liệu tồn tại sau restart |
| Integration Security | 401, thiếu quyền 403, ID khác trường, role bị thu hồi, membership hết hạn; HS/PH không đọc draft hoặc người khác; RLS nếu áp dụng |
| Integration Workflow | Chặn publish chưa duyệt/còn conflict; recheck sau khi approved; publish lặp; thay phiên bản giữ lịch sử; audit/outbox sau commit |
| UI | Form và lỗi API, lọc/phân trang, nút theo quyền, conflict panel, loading/empty/error, keyboard cơ bản |
| E2E | Dữ liệu thật từ UI → API → PostgreSQL → portal GV/HS, reload vẫn đúng; bao gồm các nhánh thất bại trong demo |

Dùng xUnit/Moq hiện có; WebApplicationFactory cho API và PostgreSQL test riêng (container nếu môi trường hỗ trợ). Không dùng EF InMemory để kết luận constraint/transaction PostgreSQL. Đề xuất Vitest/Testing Library cho UI và Playwright cho E2E sau khi kiểm tra tương thích với package hiện có. CI chạy backend build/tests, frontend typecheck/build/tests và integration/E2E ở môi trường có DB test; không kết nối DB dùng chung để reset/seed test.

## 12. Lộ trình 20 ngày làm việc cho một TV2

Ước lượng sau khi chốt hợp đồng nhóm; chưa gắn ngày lịch vì chưa có deadline. Cộng 3–5 ngày dự phòng nếu schema/identity khác giả định hoặc tích hợp nhóm chậm. Mỗi đợt gồm UI, API, validation, quyền và test tương ứng.

| Mốc | Ngày | Công việc | Điều kiện hoàn tất |
|---|---|---|---|
| M0 | 1–2 | Hoàn thiện mapping từ metadata đã đọc, hợp đồng và chiến lược baseline/migration | Không còn mơ hồ bảng/owner/identity/lifecycle |
| M1 | 3–4 | School context, entities nền, migration thử, permission mapping, UI layout/API client | DB thử dựng được, quyền/scope test đạt |
| M2 | 5–7 | Học sinh, lớp/enrollment/chuyển lớp, môn/chương trình | Luồng quản lý dữ liệu lưu thật; test nghiệp vụ đạt |
| M3 | 8–9 | Phân công GV/GVCN, staff/room adapters | UI phân công dùng dữ liệu thật; hiệu lực và lịch sử đúng |
| M4 | 10–13 | Timetable draft, materialization, conflict engine, reservation/concurrency | Xếp lịch được; chặn 3 loại trùng cả khi ghi đồng thời |
| M5 | 14–15 | Submit/approve/reject/publish, audit, portal contract | Chỉ lịch được duyệt/công bố xuất hiện cho consumer |
| M6 | 16–17 | Dạy thay và lịch kiểm tra tích hợp cùng conflict engine | Không tạo trùng, đúng ngoại lệ ngày, cập nhật portal |
| M7 | 18–20 | E2E, security/integration, sửa lỗi, seed demo, tài liệu/runbook và bàn giao | Toàn bộ checklist bàn giao đạt, demo chạy lại được |

Thứ tự phụ thuộc: M0 → M1 → M2/M3 → M4 → M5 → M6 → M7. Không trì hoãn test đến M7; M7 dành cho tích hợp tổng thể và ổn định. Nếu thiếu thời gian, cắt kéo thả/auto-generation/export nâng cao; giữ toàn bộ chức năng tối thiểu được giao.

## 13. Kịch bản demo end-to-end

Dữ liệu seed giả, idempotent và tách môi trường: 2 trường để test scope; 1 năm học, 2 học kỳ; tối thiểu 2 lớp, 3 môn, 4 GV, 3 phòng; 10–20 HS; tài khoản Giáo vụ, người duyệt, GV, HS/PH. Không ghi mật khẩu/token vào git.

1. Đăng nhập Giáo vụ → chọn trường/năm học → tạo HS → kiểm tra mã trùng bị chặn.
2. Tạo lớp, xếp HS, chuyển một HS và chứng minh lịch sử/sĩ số đúng; lớp đầy không nhận thêm.
3. Tạo môn/chương trình, phân công GV và GVCN; thử GV không hợp lệ bị từ chối.
4. Tạo lịch nháp, thêm các ô hợp lệ; cố ý tạo trùng GV, lớp, phòng và xem từng lỗi.
5. Sửa hết lỗi → gửi duyệt → tài khoản quản lý duyệt → Giáo vụ công bố. HS không xem được trước công bố, xem đúng sau công bố.
6. Bố trí GV thay cho một ngày; GV đang bận bị chặn; chọn GV rảnh thành công. Mẫu lịch tuần giữ nguyên, lịch GV/HS ngày đó đổi đúng.
7. Tạo lịch kiểm tra trùng giờ học/phòng/GV bị chặn; đổi giờ hợp lệ và công bố; portal thấy lịch mới.
8. Thử sửa URL/ID tài nguyên trường khác, user thiếu quyền và membership hết hạn đều bị chặn.
9. Reload UI/restart API chứng minh dữ liệu bền vững; xem audit. Chạy bài kiểm thử đồng thời để chứng minh không thể ghi hai ca trùng slot.

Ghi expected/actual cho từng bước, ảnh/video nếu cần, script seed và reset giới hạn môi trường demo. Không reset Supabase dùng chung.

## 14. Checklist bàn giao và Definition of Done

- [ ] Hoàn thiện và xác nhận owner cho mapping dựa trên schema Supabase đã đọc.
- [ ] Entity/mapping/migration/baseline, SQL diff và rollback đã thử trên PostgreSQL tách biệt.
- [ ] AA-01 đến AA-12 có UI/API nối DB thật; đủ loading/empty/error/validation.
- [ ] Kiểm tra GV/lớp/phòng và tranh chấp đồng thời dùng chung cho lịch học, dạy thay, kiểm tra.
- [ ] Quyền chi tiết, scope trường, membership hiệu lực/thu hồi, scope GV/HS/PH đã kiểm thử.
- [ ] Lifecycle và publication đúng, không lộ draft; giữ lịch sử phiên bản và chuyển lớp.
- [ ] Backend build/tests, frontend build/UI tests, integration/E2E đạt; ghi kết quả thực tế và lỗi còn lại.
- [ ] Swagger/OpenAPI và API examples/collection hoàn chỉnh.
- [ ] README chạy local; cấu hình env mẫu không có secret; hướng dẫn migrate/seed/demo/troubleshoot.
- [ ] ERD, schema mapping, rule conflict, permission matrix, contract TV1/TV3/TV5 và demo checklist bàn giao.
- [ ] Từng PR có phạm vi rõ, migration ảnh hưởng gì và bằng chứng validation; không commit/push tự động chỉ từ kế hoạch này.

Rủi ro trọng tâm: quy tắc hiệu lực, lịch sử và chống trùng theo giờ chưa được schema hiện tại bao phủ đầy đủ; truy vấn seed/fallback ở StudentPortal có thể che lỗi tích hợp; quyền hiện tại chưa đủ school scope; hai luồng migration có thể lệch; timetable/exam/substitution dùng cơ chế giữ chỗ khác nhau dễ tạo xung đột. Xử lý tương ứng ở M0, M1 và M4 trước khi công bố dữ liệu thật.

Tài liệu tham khảo kết nối: https://supabase.com/docs/guides/ai-tools/mcp . Kế hoạch này chưa thực thi thay đổi schema hoặc triển khai chức năng.
