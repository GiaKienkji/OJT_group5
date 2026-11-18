# Chạy và bàn giao TV2 Giáo vụ

Module dùng ASP.NET, React và PostgreSQL. Hai migration đã được áp lên Supabase nhóm ngày 19/11/2026. Xem [bàn giao và kiểm thử hosted](hosted-handoff.md) để chạy ứng dụng với database nhóm. Hai migration trong thư mục `supabase/migrations` bổ sung chương trình lớp, lịch sử GVCN và metadata duyệt/hiệu lực phiên bản. Chạy hai migration theo thứ tự tên file sau khi chuẩn bị schema hiện hữu. Chuỗi kết nối ASP.NET dùng `ConnectionStrings__DefaultConnection` và giữ ngoài repo. Backend ưu tiên cấu hình môi trường tiến trình hơn file Development `.env`.

## PostgreSQL thử và test backend

Tạo một cluster PostgreSQL 17 riêng trên `127.0.0.1`, một role fixture có quyền khởi tạo schema/role, và database `academic_m0_test`. Các lệnh bên dưới dùng biến chuẩn của PostgreSQL (`PGHOST`, `PGPORT`, `PGUSER`) trỏ tới cluster này. Test integration yêu cầu DB tên `academic_m0_test`.

```powershell
psql -X -d academic_m0_test -v ON_ERROR_STOP=1 -f docs/academic/M0-rls-catalog-fixture.sql -f docs/academic/M0-rls-smoke.sql -f docs/academic/M1-M2-api-fixture.sql -f docs/academic/M6-api-fixture.sql
Get-ChildItem supabase/migrations -Filter '*.sql' | Sort-Object Name | ForEach-Object {
    psql -X -1 -d academic_m0_test -v ON_ERROR_STOP=1 -f $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
$env:SOMS_ACADEMIC_TEST_DB = 'Host=127.0.0.1;Port=<port>;Username=<fixture-role>;Database=academic_m0_test'
dotnet test backend/SOMS.UnitTests/SOMS.UnitTests.csproj
```

Test integration chạy xuyên HTTP với JWT, hai trường và thời gian cố định. Bài test ghi dữ liệu tổng hợp. Với các test thông thường có thể bỏ biến `SOMS_ACADEMIC_TEST_DB`; ca PostgreSQL sẽ được đánh dấu bỏ qua.

## Demo trình duyệt

1. Dùng fixture mới đã áp dụng migration. Cài dependency frontend theo lockfile. Dùng một mật khẩu tạm dành riêng cho fixture và đặt trong biến môi trường `SOMS_ACADEMIC_DEMO_PASSWORD` của phiên PowerShell.
2. Chạy `psql -X -d academic_m0_test -v ON_ERROR_STOP=1 -f docs/academic/M7-demo-seed.sql`. Seed chạy lặp được, tự tạo hai trường, tài khoản Giáo vụ, BGH, giáo viên, học sinh và phụ huynh, năm học, học kỳ, khối, giáo viên, phòng và tiết. Hậu tố email demo là `@tv2-demo.invalid`.
3. Chạy backend với `ConnectionStrings__DefaultConnection` trỏ fixture, `ASPNETCORE_ENVIRONMENT=Testing` và `dotnet run --project backend/SOMS.Api --no-launch-profile -- --urls http://127.0.0.1:5062`. Chạy Vite trong `frontend` bằng `npm run dev`. Swagger chạy trong Development ở `/swagger`.
4. Với Chrome và Playwright Core, đặt `SOMS_CHROME_BIN` là đường dẫn Chrome và `SOMS_PLAYWRIGHT_MODULE` là đường dẫn module nếu cài Playwright Core riêng. Chạy `node frontend/tests/academic-smoke.cjs` từ repo. Dùng DB fixture mới cho mỗi lần chạy toàn luồng để chương trình và lịch còn rỗng.
5. Trình duyệt đăng nhập Giáo vụ, tạo lớp/học sinh, liên kết tài khoản, ghi danh và chuyển lớp. Sau đó tạo môn, cấu hình chương trình, phân công GV/GVCN, lập lịch nháp, đăng nhập BGH duyệt, công bố bằng tài khoản Giáo vụ, bố trí dạy thay và công bố kiểm tra. Đăng nhập học sinh để xác nhận lịch thực tế.

## API và mặc định nghiệp vụ

Toàn bộ API Giáo vụ dưới `/api/academic`. Gửi Bearer JWT và `schoolId` khi người dùng có quyền ở nhiều trường. `revision` lấy từ lần đọc mới nhất. Sử dụng `409` để tải lại và xử lý thay đổi đồng thời.

| Luồng | API chính | Ví dụ body |
|---|---|---|
| Lớp, học sinh và ghi danh | `POST /classes`, `POST /students`, `POST /classes/{id}/enrollments`, `POST /enrollments/{id}/transfer` | Chuyển lớp `{"classId":"<lớp đích>"}` |
| Chương trình và phân công | `PUT /classes/{id}/subjects`, `POST /teaching-assignments`, `POST /classes/{id}/homeroom-assignments` | Chương trình `{"semesterId":"<kỳ>","subjects":[{"subjectId":"<môn>","weeklyPeriods":2}]}` |
| Lịch | `POST /timetables`, `POST /timetables/{id}/entries`, `POST /timetables/{id}/validate` | Ô lịch `{"teachingAssignmentId":"<phân công>","roomId":"<phòng>","periodId":"<tiết>","weekday":1,"revision":123}` |
| Duyệt | `POST /timetables/{id}/submit`, `/approve`, `/reject`, `/publish` | `{"revision":123}`. Công bố có thêm `effectiveFrom` tùy chọn |
| Dạy thay và kiểm tra | `POST /substitutions`, `POST /substitutions/{id}/cancel`, `POST /exams`, `POST /exams/{id}/publish`, `/cancel` | Dạy thay `{"slotId":"<ô lịch>","onDate":"2026-11-19","staffId":"<GV thay>"}` |
| Portal | `GET /schedule?from=2026-11-19&to=2026-11-25` | Lớp, giáo viên và phòng là bộ lọc tùy chọn |

- Ghi danh và chủ nhiệm dùng khoảng ngày `[bắt đầu, ngày kết thúc)`. Giáo viên hợp lệ theo bảng `staff`, trường và ngày hiệu lực. Tổng số tiết phân công hoạt động không vượt chương trình lớp. Đồ án hiện dùng dữ liệu nhân sự sẵn có cho việc lọc giáo viên; chưa có nguồn chuyên môn hoặc định mức riêng.
- Lịch nháp kiểm tra trùng lớp, giáo viên và phòng theo giờ thật, kể cả khi ID tiết khác nhau. BGH có quyền duyệt và tác giả không tự duyệt. Giáo vụ có quyền công bố. Khi thay phiên bản đã hiệu lực, mốc mặc định là ngày tiếp theo theo giờ trường. Bản trước còn truy vấn được theo khoảng hiệu lực.
- Dạy thay áp dụng đúng ô lịch và ngày, xét nghỉ phép đã duyệt và ca đã chốt điểm danh. Lịch kiểm tra dùng một lớp mỗi ca và phòng tùy chọn. Schema demo chưa có quan hệ giám thị, lịch ngày lễ hay nguồn thông báo ngoài ứng dụng.
- Portal lấy lịch bằng API, kiểm tra giáo viên thực tế, ghi danh hợp lệ hoặc liên kết phụ huynh đã xác minh. API chỉ đưa lịch có hiệu lực và ca kiểm tra đã công bố.

## Cập nhật schema đã có

Đã xác minh schema-only của Supabase trên PostgreSQL thử. Dùng Supabase CLI để áp hai migration cho staging hoặc database thử có baseline. Thử hoàn tác theo thứ tự [M5](M5-timetable-lifecycle-rollback.sql) rồi [M3](M3-curriculum-homeroom-rollback.sql). Sao lưu dữ liệu chương trình, lịch sử chủ nhiệm, duyệt và khoảng hiệu lực trước khi hoàn tác sau khi đã có sử dụng. Quản lý phiên bản migration và triển khai app cùng đợt để API đọc được schema mới.

Xem [bằng chứng kiểm thử](M1-M2-verification.md) và [đối chiếu baseline](M0-postgres-verification.md).
