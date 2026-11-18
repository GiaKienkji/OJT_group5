# Nghiệm thu Giáo vụ TV2

Kiểm tra ngày 19/11/2026 trên nhánh `hau`. Mọi thao tác ghi dùng PostgreSQL 17.12 riêng trên loopback với dữ liệu tổng hợp.

| Hạng mục | Kết quả |
|---|---|
| Supabase runtime | Chạy [runtime-access.sql](runtime-access.sql) qua `SomsDbContext` được đăng ký bởi cùng cấu hình Npgsql của ứng dụng, với file riêng trên Desktop và TLS `VerifyFull`. PostgreSQL 17.11 trả `session_user = current_user = postgres`, `rolsuper = false`, `rolbypassrls = true`. RLS bật, FORCE tắt và không áp dụng cho principal này trên cả 32 bảng kiểm tra. Đây là ca đọc metadata. |
| M0 RLS fixture | Fixture 9 bảng và SQL smoke chạy lại đạt trên PostgreSQL 17.12. |
| API trên PostgreSQL | Kiểm tra JWT hợp lệ, ngày hiệu lực ở hai múi giờ, chọn trường ngoài quyền, ID lớp trường khác, tạo/lọc lớp, mã trùng, FK khối sai trường, revision cũ, liên kết profile cùng trường, môn ngừng hoạt động, tranh chỗ cuối, lịch sử chuyển lớp, audit và rollback khi audit lỗi. Cùng JWT bị từ chối sau khi thu hồi quyền. |
| Trình duyệt | Chrome headless đăng nhập bằng tài khoản Giáo vụ của fixture, tạo hai lớp và học sinh, tải lại hồ sơ, ghi danh, chuyển lớp và kiểm tra lịch sử ở lớp nguồn, sĩ số ở lớp đích sau reload. Tạo môn, sửa thành ngừng hoạt động và reload thấy đúng trạng thái. |

## Kết quả các mốc lịch

- API chạy qua chương trình lớp, phân công và lịch sử GVCN, lịch nháp, xung đột giờ của hai tiết khác ID, ghi đồng thời, quyền gửi/duyệt/công bố, giữ lịch phiên bản cũ, dạy thay/hủy, kiểm tra/công bố/hủy và học sinh xem theo trường/lớp.
- Smoke Chrome dùng ba tài khoản thật trong fixture. Trình duyệt tạo lớp, học sinh, liên kết tài khoản, ghi danh/chuyển lớp, tạo môn, cấu hình chương trình, phân công/GVCN, gửi duyệt, công bố, dạy thay và công bố kiểm tra. Portal học sinh hiển thị cả hai ca sau tải lại.
- Chạy toàn bộ suite backend với fixture PostgreSQL, kết quả 39/39. Ca integration chạy thêm trên baseline đã khôi phục và áp migration cũng đạt. TypeScript và Vite build đạt. Có cảnh báo audit NuGet và kích thước chunk Vite.
- Chạy cả hai migration, hoàn tác và áp lại trên bản khôi phục schema. Xem [baseline](M0-postgres-verification.md).

## Chạy lại kiểm thử API

Dựng PostgreSQL thử mới, chạy trên `127.0.0.1` và tạo database `academic_m0_test`. Role fixture cần đủ quyền tạo các role kiểm thử và schema trong cluster riêng.

```powershell
psql -X -d academic_m0_test -v ON_ERROR_STOP=1 -f docs/academic/M0-rls-catalog-fixture.sql -f docs/academic/M0-rls-smoke.sql -f docs/academic/M1-M2-api-fixture.sql -f docs/academic/M6-api-fixture.sql
Get-ChildItem supabase/migrations -Filter '*.sql' | Sort-Object Name | ForEach-Object {
    psql -X -1 -d academic_m0_test -v ON_ERROR_STOP=1 -f $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Migration failed: $($_.Name)" }
}
$env:SOMS_ACADEMIC_TEST_DB = 'Host=127.0.0.1;Port=<port>;Username=<fixture-role>;Database=academic_m0_test'
dotnet test backend/SOMS.UnitTests/SOMS.UnitTests.csproj
```

Nếu role cần mật khẩu, thêm từ cấu hình thử ngoài repo. Khi không đặt `SOMS_ACADEMIC_TEST_DB`, ca PostgreSQL được đánh dấu bỏ qua. Ca thử cần fixture đã nạp và sẽ ghi dữ liệu tổng hợp. Dùng cluster thử dùng một lần hoặc khởi tạo lại trước khi bàn giao.

## Quy tắc phiên bản hiện tại

- Ngày ghi danh theo giờ trường và nằm trong năm học `active`. Chuyển lớp trong cùng trường, năm học và khối. Khoảng hiệu lực là `[enrolled_on, left_on)`, cho phép chuyển ngay trong ngày ghi danh. Quyền chuyển lớp gồm `classes.manage` và `students.manage`.
- Lưu trữ hồ sơ học sinh đang học chuyển sang `withdrawn`. Lưu trữ lớp chuyển sang `archived`. Cả hai yêu cầu revision và chặn khi còn ghi danh `active`. Môn học dùng `is_active` để ngừng hoạt động.
- ASP.NET kiểm tra membership, quyền và các khóa ngoại theo phạm vi trường. Principal đã đo có `BYPASSRLS`. Quyết định về principal lâu dài và quyền tối thiểu thuộc bước chốt với TV1/chủ DB.
- Mặc định triển khai được ghi trong [runbook](README.md). DDL chạy thử trên bản khôi phục cục bộ. Hai migration đã chạy trên Supabase nhóm ngày 19/11/2026. [Bằng chứng hosted](hosted-handoff.md).
