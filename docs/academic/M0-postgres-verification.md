# Baseline và kiểm thử PostgreSQL cho M0

## Nguồn migration đề xuất

TV1 và chủ sở hữu DB xác nhận SQL migrations của Supabase là nguồn DDL duy nhất. EF Core ánh xạ bảng hiện hữu và kiểm thử mapping với baseline. API chỉ kết nối DB khi khởi động. Những thay đổi sau baseline có migration tiến và phương án hoàn tác hoặc phục hồi được review. Kiểm tra phiên bản CLI trước khi dùng vì CLI v3 đã thay đổi mặc định chọn môi trường. [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations)

1. Xác nhận project nguồn, PostgreSQL 17, extension, auth/storage dependency, role, schema và quyền cần để tái tạo DB. Xuất schema-only bằng công cụ đã được chủ DB phê duyệt, gồm policies, grants, default privileges, functions, triggers, indexes và CHECK/FK. Ghi phiên bản tool, nguồn, thời điểm và SHA-256. Kiểm tra nội dung trước khi đưa vào Git, nhất là secret trong function/default và grant đặc thù môi trường.
2. Khởi tạo Supabase local hoặc project thử độc lập với cấu hình tương thích. Supabase đã cung cấp auth schema và các role chuẩn. Xác định phần bootstrap và phần baseline public để tránh tạo trùng role/schema thuộc nền tảng. Khôi phục schema theo đúng thứ tự phụ thuộc, giữ lịch sử migration riêng ở database thử.
3. Xuất catalog hai phía qua [inspect-schema.sql](inspect-schema.sql), bỏ trường `exported_at` khỏi JSON khi so sánh và kiểm tra các hàng trong migration history riêng. So sánh thêm hai bản schema dump bằng cùng tool/version/options để bắt các khác biệt ngoài script catalog, chẳng hạn thân hàm và default privilege. Giải trình các khác biệt môi trường. Mọi chênh lệch TV2 còn lại đều phải được xử lý trước khi chấp nhận baseline.
4. Với DB đang có schema, đối chiếu schema và lịch sử với baseline trước khi đánh dấu baseline đã áp dụng bằng công cụ migration đã thống nhất. Với DB trống, chạy baseline đầy đủ. Thử hai đường trên DB tách biệt. Việc đánh dấu trên DB dùng chung cần phê duyệt riêng của owner.

## Bằng chứng trên DB thử

Xác nhận hostname/project/database từ cấu hình trước khi chạy, tách biến kết nối kiểm thử khỏi ứng dụng dùng chung. Dùng dữ liệu tổng hợp với hai trường, hồ sơ và membership có quyền khác nhau, bản lịch draft/published, phụ huynh liên kết và không liên kết. Giữ chuỗi kết nối và token ngoài báo cáo.

Chạy [runtime-access.sql](runtime-access.sql) bằng chính kết nối Npgsql dùng ở ASP.NET hoặc cùng thông tin đăng nhập qua psql. Lưu role, cờ bypass, grant và RLS. Đây là phép đọc metadata, chạy được trước khi có dữ liệu thử. Sau đó chạy các ca dưới đây bằng JWT/kết nối thực của từng role trong DB thử và lưu expected/actual.

| Ca | Kết quả cần đối chiếu |
|---|---|
| API Giáo vụ có quyền trường A | Đọc/ghi dữ liệu thử của A. Chọn B khi thiếu membership/quyền trả 403, ID nghiệp vụ của B trong phạm vi A trả 404. |
| Membership hết hạn hoặc quyền vừa thu hồi | Cùng JWT trước đó trả 403 cho thao tác ghi. Kiểm tra ngày mốc theo timezone và ngày NULL ở hai đầu. |
| PostgREST `anon` và `authenticated` nếu bật | Quan sát SQL grant và lọc dòng theo policy bằng đúng JWT, gồm GV khác lớp, HS khác trường, phụ huynh khác liên kết, và bản draft. Phân biệt lỗi privilege với truy vấn thành công nhưng không thấy dòng. Đối chiếu UPDATE bằng SELECT policy và WITH CHECK nếu có đường ghi trực tiếp. |
| Kết nối ASP.NET có BYPASSRLS hoặc là owner | Xác nhận phạm vi do API thi hành. Kết nối có khả năng đọc xuyên trường phải vẫn nhận lỗi khi gọi API với danh tính sai trường. |
| Phân quyền duyệt/công bố | Kiểm tra độc lập `timetables.approve` và `timetables.publish`. Đường lifecycle chạy lại khi phần API tương ứng được triển khai. |

## SQL diff, triển khai và rollback

1. Chụp schema A sau khi restore baseline vào DB thử, chạy diff với nguồn và lưu các khác biệt đã giải trình. Seed fixture tối thiểu và chụp số đếm theo trường, trạng thái và các khóa nghiệp vụ cần giữ.
2. Khi nhóm duyệt delta đầu tiên, chạy truy vấn tiền kiểm về trùng khóa, dữ liệu mồ côi hoặc khác trường, date range chồng lấn, trạng thái cũ và phụ thuộc của đối tượng. Lưu kế hoạch khóa và timeout nếu delta đụng bảng có dữ liệu.
3. Chạy delta trong môi trường thử, chụp schema B. Chạy diff A → B, đối chiếu phạm vi DDL, RLS/grant, constraint và số đếm. Thử chạy lại bằng migration runner để kiểm tra lịch sử áp dụng.
4. Chạy rollback đã review trên môi trường thử, chụp schema C, kiểm tra diff C ↔ A và đối chiếu lại fixture. Với thay đổi dữ liệu không đảo ngược, thử phục hồi từ bản sao lưu và ghi phần dữ liệu có thể mất sau mốc khôi phục. Kiểm tra lỗi giữa chừng để biết runner đã rollback transaction hay cần thao tác bù.
5. Chỉ đóng phần kiểm thử M0 khi lưu được bằng chứng baseline/diff/rollback trên DB tách biệt. Có thể dùng delta diễn tập hoàn tác được nếu chưa có delta nghiệp vụ được phê duyệt. Giữ delta diễn tập ngoài lịch sử migration ứng dụng.

## Trạng thái thực tế

Ngày 18/11/2026, chạy trên PostgreSQL 17.12 tách biệt, localhost, database `academic_m0_test`. Dựng 9 bảng từ catalog Supabase bằng [fixture](M0-rls-catalog-fixture.sql). Fixture dùng stub `auth.users` và `auth.uid()`, cùng hàm kiểm tra membership và policy phiên bản lịch từ catalog. Trigger publish và các bảng ngoài lát cắt cần baseline đầy đủ.

Chạy lại trên cluster PostgreSQL thử mới với role quản trị bằng hai lệnh sau. Cấu hình host, port và role thử qua biến kết nối PostgreSQL trước khi chạy.

```powershell
createdb academic_m0_test
psql -X -d academic_m0_test -v ON_ERROR_STOP=1 -f docs/academic/M0-rls-catalog-fixture.sql -f docs/academic/M0-rls-smoke.sql
```

| Ca | Kết quả thực tế |
|---|---|
| Grant của `anon` | Không có SELECT trên `timetable_versions`. |
| RLS/grant của `authenticated` | Membership còn hiệu lực thấy 1/4 dòng, đúng lịch công bố của trường A; không có UPDATE lịch hoặc SELECT membership. Hết hạn thấy 0/4 dòng. |
| Role có `BYPASSRLS` | `service_role` thấy 4/4 dòng, RLS không áp dụng với role này. |
| Diff/rollback diễn tập | Thêm CHECK trùng điều kiện dương của `version_no`, dump schema chỉ thêm CHECK diễn tập. Gỡ CHECK, dump `--schema-only --no-owner --restrict-key=AcademicM0` giống hệt dump đầu theo SHA-256 `A67C17C614BD2F45C6C3B2FA79341CF45FB34F23187EDBFCD4D51EB4E7106694`. Chạy lại smoke đạt. |

Ngày 19/11/2026 đã chạy thành công phép đọc runtime qua `SomsDbContext` với Shared Pooler và TLS `VerifyFull`. Principal được đo là `postgres`, có `BYPASSRLS`. Đã chạy lại smoke fixture và bổ sung kiểm thử API xác thực trên PostgreSQL tách biệt. Phần baseline app mới được ghi bên dưới. Quyền runtime tối thiểu và JWT PostgREST thật thuộc lượt triển khai hosted nếu dùng Data API. [Bằng chứng và cách chạy lại](M1-M2-verification.md).

## Baseline app thực tế ngày 19/11/2026

- `pg_dump 17.12 --schema-only --no-owner` qua Shared Pooler với `verify-full` đã lấy hai schema ứng dụng `public` và `soms_private`. SHA-256 của dump gốc là `7AC8F4DF7C605AB8FF90D3C63BA1DBB04F90E7B2163C1487C69850636C86AB44`. Dump nằm trong thư mục làm việc cục bộ và không chứa bản ghi nghiệp vụ.
- Khôi phục thành công vào PostgreSQL 17.12 tách biệt với stub `auth.users`, `auth.uid()` và các role nền tảng. Đối chiếu `inspect-schema.sql` trùng 78 bảng, 735 cột, 325 constraint, 161 index, 35 policy, 8 trigger và 7 function công khai. Tổng số grant là 1.407 ở cả hai phía. Tên owner/grantor cục bộ và cách trình bày ACL/default privilege khác theo môi trường. Sau chuẩn hóa whitespace, diff schema-only còn các dòng ACL và không có chênh lệch DDL nghiệp vụ.
- Supabase CLI 3.2.0 áp đúng hai migration trên bản khôi phục. Lần chạy lại báo không còn migration chờ. Đã chạy hai script hoàn tác, kiểm tra lại catalog, đánh dấu hai migration `reverted` trong lịch sử riêng và áp lại thành công. Các thao tác này chỉ dùng DB loopback.
- Mô hình nền tảng Supabase dùng stub trong DB cục bộ. Ca RLS xác thực qua Data API với JWT Supabase và chuyển lịch sử migration của project hosted cần đợt triển khai riêng.
