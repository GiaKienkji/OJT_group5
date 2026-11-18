# Bàn giao Supabase nhóm · 19/11/2026

Đã áp migration lên project Supabase `jaivisftvckbaxnnzhbi`, database `postgres`, qua Shared Session Pooler cổng `5432`. Máy khách xác thực chứng chỉ máy chủ bằng `verify-full` và kết nối bằng TLS 1.3.

| Migration | Kết quả |
|---|---|
| `20261118173407` | Tạo bảng chương trình lớp/học kỳ và lịch sử chủ nhiệm. |
| `20261118174407` | Bổ sung revision, duyệt và khoảng hiệu lực cho thời khóa biểu. |

Supabase CLI 3.2.0 áp thành công cả hai migration. Lệnh `migration list` xác nhận phiên bản local và hosted trùng nhau. Bản sao schema trước khi áp có SHA-256 `7AC8F4DF7C605AB8FF90D3C63BA1DBB04F90E7B2163C1487C69850636C86AB44`, trùng với baseline đã diễn tập.

## Kiểm thử hosted

- [Smoke SQL](hosted-smoke.sql) xác minh hai migration có trong lịch sử, RLS bật trên hai bảng mới, vai trò `anon` và `authenticated` không có quyền CRUD trực tiếp. Tạo dữ liệu tổng hợp trong một trường thử tạm, kiểm tra ghi chương trình, ghi lịch sử chủ nhiệm và trigger công bố thời khóa biểu. Transaction đã rollback và truy vấn sau rollback xác nhận trường thử đã biến mất.
- [Smoke API](../../backend/SOMS.UnitTests/HostedAcademicSmokeTests.cs) chạy ứng dụng ASP.NET trong test host với kết nối Npgsql tới Supabase nhóm. 19 lượt đọc được phép thành công, gồm lớp, học sinh, môn, dashboard, học kỳ, lịch nháp, lịch công bố, ca dạy thay và kiểm tra. Yêu cầu thiếu JWT trả `401`; yêu cầu chọn trường ngoài phạm vi trả `403`. JWT được ký riêng trong test host và dùng membership Giáo vụ đang hiệu lực trên DB để kiểm tra phân quyền.
- Thời điểm bàn giao có một học kỳ trong trường dùng cho smoke API, chưa có dòng chương trình, lịch sử chủ nhiệm hay thời khóa biểu công bố trong DB nhóm. Luồng đầy đủ trên Chrome đã được nghiệm thu với dữ liệu demo ở PostgreSQL thử. [Bằng chứng demo](M1-M2-verification.md)

## Chạy ứng dụng với Supabase nhóm

Mở PowerShell tại gốc repo. Đoạn này đọc file cấu hình riêng trên Desktop và chỉ đặt chuỗi kết nối trong phiên tiến trình hiện tại.

```powershell
$path = Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'supabase-jaivisftvckbaxnnzhbi.env'
$pg = Get-Content -LiteralPath $path -Raw | ConvertFrom-StringData
$db = [System.Data.Common.DbConnectionStringBuilder]::new()
$db['Host'] = $pg.PGHOST
$db['Port'] = $pg.PGPORT
$db['Database'] = $pg.PGDATABASE
$db['Username'] = $pg.PGUSER
$db['Password'] = $pg.PGPASSWORD
$db['SSL Mode'] = 'VerifyFull'
$db['Root Certificate'] = $pg.PGSSLROOTCERT
$env:ConnectionStrings__DefaultConnection = $db.ConnectionString
dotnet run --project backend/SOMS.Api --no-launch-profile -- --urls http://127.0.0.1:5062
```

Chạy `npm run dev` từ `frontend` trong phiên PowerShell thứ hai, rồi mở `http://localhost:5173` và đăng nhập bằng tài khoản hiện có của nhóm.

Để chạy lại smoke API, thực hiện phần tạo chuỗi kết nối ở trên trong một phiên riêng rồi chạy:

```powershell
$env:SOMS_ACADEMIC_HOSTED_READONLY_DB = $db.ConnectionString
dotnet test backend/SOMS.UnitTests/SOMS.UnitTests.csproj --filter FullyQualifiedName~HostedAcademicSmokeTests --logger 'console;verbosity=detailed'
Remove-Item Env:SOMS_ACADEMIC_HOSTED_READONLY_DB
```

Bàn giao lần này gồm database hosted và mã nguồn trên nhánh `hau`. Phát hành giao diện/backend lên dịch vụ web, nếu nhóm dùng một địa chỉ web riêng, là bước triển khai ứng dụng. [Runbook chung](README.md)
