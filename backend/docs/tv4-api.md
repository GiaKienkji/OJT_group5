# TV4 API contract

All routes require the existing JWT and permission policies. Server derives actor and school from the JWT, verifies active, date-valid school membership and an active profile, and scopes every lookup/foreign key. Bodies never contain actor/school IDs. JSON uses camelCase; dates ISO 8601; amounts decimal VND (at most two decimal places). IDs come from selectors, not manual text input. Validation 400, unauthenticated 401, forbidden 403, missing/cross-school resource 404, invalid state/conflict 409. Profile name/phone may be changed through `PUT /api/finance/me` or `PUT /api/facility/me`; login, logout and password changes stay under `/api/auth`.

## Finance `/api/finance`

- `GET lookups?academicYearId=&gradeLevelId=&classId=&search=` returns `{academicYears,semesters,grades,classes,students}`; options contain `id,code,name` and applicable parent IDs.
- `GET dashboard` returns `totalCollected,outstandingDebt,activeCampaigns,paymentsToday,unreconciledTransactions`.
- `GET/POST fee-categories`; `PUT fee-categories/{id}` body `{code,name,isActive}`.
- `GET/POST fee-campaigns`; `PUT fee-campaigns/{id}` body `{name,academicYearId,semesterId?,dueDate?,status}` (`draft|issued|closed`).
- `GET/PUT fee-campaigns/{id}/rules` body array of `{feeCategoryId,gradeLevelId?,classId?,amount,dueDate?}`. Class-specific rules override grade rules for the same fee type.
- `POST fee-campaigns/{id}/assignments` body `{studentIds:[]}` (empty selects all enrolled students matching rules); response `{createdCount,duplicateCount}`. Atomic, deduplicated.
- `GET fee-assignments?campaignId=&studentId=&classId=&gradeLevelId=&status=&overdue=` returns charge rows with `id,studentId,studentCode,studentName,classId,className,feeCategoryId,feeName,campaignId,amount,discount,amountDue,amountPaid,balance,dueDate,status`. The recorded class at charge creation is retained after transfers; pre-existing shared charges use the enrollment in the campaign year when available.
- `GET debts` accepts the same filters, returns positive-balance charge rows only.
- `GET/POST fee-assignments/{id}/exemptions` body `{amount,reason}`; `POST exemptions/{id}/decision` body `{decision:approved|rejected,note?}`. Non-requester with `workflow.approve`; approved discounts applied atomically within financial bounds.
- `GET/POST fee-campaigns/{id}/notices` body `{title,message}`; `POST notices/{id}/send` returns `{recipientCount,notificationIds}`. Repeat send does not duplicate inbox rows.
- `POST debts/{id}/reminder` body `{channel:in_app,message?,requestKey}`; `requestKey` is a client-generated UUID retained on retry; same response on retry, including a zero-recipient result. Verified guardian finance links only. Email/SMS delivery is not offered.
- `GET payments?status=&studentId=`; `POST payments` body `{studentId,amount,paymentMethod,paidAt?,allocations:[{chargeId,amount}]}` creates pending payment; `POST payments/{id}/verify` body `{decision:verified|rejected,note?}`. Verification allocates exactly once.
- `GET bank-transactions?status=`; `POST bank-transactions/import` body `{source,transactions:[{transactionId,reference,amount,transactionAt,description?}]}`; `POST payments/reconcile` body `{matches:[{bankTransactionId,paymentId}]}`. Import source/transaction ID is unique; reconciliation verifies exact amounts.
- `GET/POST adjustments` body `{paymentId,type:refund|correction,amount,reason}`; `POST adjustments/{id}/decision` body `{decision:approved|rejected,note?}` requires approval permission and a different actor; `POST adjustments/{id}/execute` executes approved adjustment once. Responses include workflow ID and history.
- `POST receipts/{paymentId}` is retry-idempotent for verified payments; `GET receipts/{id}`; `GET receipts/{id}/download` returns PDF. A fully refunded payment cannot issue its first receipt, but an issued receipt remains retrievable as its original transaction snapshot; adjustment history remains separate. Receipt response `id,receiptCode,paymentId,studentId,amount,issuedAt`.
- `GET payment-history?studentId=` returns payments with student name/code, class, record/verify actors, allocations, adjustments and actor-attributed audit history. Requester self-approval and same-school cross-user approval without `workflow.approve` remain forbidden.
- `GET reports?reportType=collection|debt&classId=&academicYearId=&semesterId=&fromDate=&toDate=` returns `{rows,totalDue,totalPaid,totalDebt}`. Collection date filters use verified payment dates and return collected rows in that period. Debt reports are current balances; historical date filters return 400, not an invented as-of balance.
- `POST reports/export` body `{reportType,format:xlsx|pdf,filters:{...reportFilters}}` returns a binary file.

## Facility `/api/facility`

- `GET dashboard`; `GET handlers` returns staff options `id,userId,code,name`.
- `GET/POST rooms`; `PUT rooms/{id}` body `{code,name,roomType,capacity,status:available|maintenance|closed}`.
- `GET/POST assets/categories`; `PUT assets/categories/{id}` body `{name,isActive}`.
- `GET assets?roomId=&category=&status=`; `POST assets` / `PUT assets/{id}` body `{code,name,category,serialNumber?,roomId?,status:working|damaged|maintenance|retired|lost,condition?,notes?}`.
- `POST assets/assign` body `{assetId,roomId?,note?}`; `POST assets/{id}/condition` body `{condition,status,note?}`; `GET assets/{id}/history` returns timestamped actor-attributed actions.
- `GET inventory` returns current assets. `POST inventory` body `{title,observations:[{assetId,observedRoomId?,condition,status,present}]}` stores a counted inventory session; `GET inventory/{id}` returns observations and discrepancies. No fabricated counted values.
- `GET borrow-requests`; `POST borrow-requests` body `{assetId,purpose,dueAt?}` requires `workflow.submit` (teacher or facility). `POST borrow-requests/{id}/handover` body `{note?}` and `/return` body `{condition,status,note?}` require `assets.manage`. Existing shared loans are consumed. Active usable asset and conflicting loans checked under lock.
- `GET incidents` requires `repairs.manage`; `POST incidents` body `{assetId,description,severity:low|medium|high|critical}` requires `workflow.submit` (teacher or facility); `POST incidents/{id}/severity` body `{severity}` requires `repairs.manage`.
- `GET/POST repair-requests` body `{incidentId,title,scheduledFor?}`; `POST repair-requests/{id}/handler` body `{staffId,note?}`; `/progress` body `{progressNote}`; `/result` body `{result,cost,condition,status}`; `/complete` no body. Progress cannot bypass result then confirmation.
- `GET maintenance?assetId=&status=`; `POST maintenance` body `{assetId,title,maintenanceDate,repeatIntervalMonths?}`; `POST maintenance/{id}/handler` body `{staffId,note?}` assigns an active same-school staff member; `POST maintenance/{id}/result` body `{result,cost,condition,status}`. Results require an assigned handler. Recurring completion creates the next planned occurrence once.
- `GET/POST proposals` body `{type:purchase|replacement,title,description,quantity,estimatedCost?,assetId?}`. Replacement requires asset. `POST proposals/{id}/decision` body `{decision:approved|rejected,note?}` requires `facilities.approve_purchase` and a different actor. Existing workflow rows hold status/history.
- `GET repair-history?assetId=` includes action history; `GET stats` includes real incidents by severity/status.
- `POST reports/export` body `{reportType:inventory|maintenance,format:xlsx|pdf,roomId?,category?,fromDate?,toDate?}` returns a binary file. Maintenance dates filter scheduled work; inventory is a current snapshot and rejects date filters instead of silently ignoring them.

Binary responses use PDF/XLSX MIME and `Content-Disposition: attachment`. In-app delivery means persisted `notifications`, never a claimed email/SMS delivery.

## Storage boundary

Use existing normalized `fee_types,fee_campaigns,student_charges,payments,payment_allocations,payment_adjustments,rooms,assets,asset_loans,asset_incidents,maintenance_jobs`. Academic selectors read existing `students,classes,class_enrollments,grade_levels,academic_years,semesters,staff`. Notifications use existing `notifications(user_id,title,message,kind,payload)` and verified `student_guardians.can_view_finance` links. Approval uses existing `workflow_requests,approval_steps,workflow_events`. TV5 portal and global auth/RBAC remain untouched. Additive TV4 tables supply missing rules, notices, import evidence, receipts, observations and operation metadata. Never run the obsolete duplicate-table migration against the shared database.

## Install and isolated verification

`backend/SOMS.Infrastructure/Data/Migrations/20261118_tv4_operations.sql` is an additive SQL migration with a schema fingerprint check and a version guard. It adds only TV4-owned tables under `tv4`, backfills asset-category names from existing assets, enables RLS and revokes public access. It never alters/drops shared normalized tables. The old duplicate-table migration was removed. Database owner MUST compare current schema and app-role grants, review the file, approve an install window, then apply once using an approved `psql -v ON_ERROR_STOP=1 -f backend/SOMS.Infrastructure/Data/Migrations/20261118_tv4_operations.sql` connection. **Do not run it against shared Supabase by default.** On an incompatible schema or prior version it fails and rolls back; it deliberately does not try to migrate duplicate TV4 ledgers.

The selected shared-table fixture `backend/SOMS.UnitTests/Fixtures/tv4_shared_schema.sql` contains schema only, no real student rows, accounts, passwords or credentials. For isolated relational checks, start an empty PostgreSQL database called `soms_tv4_integration` at loopback port `55432`, then provide its connection string privately as `SOMS_TV4_TEST_CONNECTION` and `ConnectionStrings__DefaultConnection`. The fixture test refuses other hosts, names or ports and validates `current_database()`, server IP and port before creating tables. Set `ASPNETCORE_ENVIRONMENT=Testing` and `DOTNET_ENVIRONMENT=Testing` so the Development-only `.env` loader cannot override the connection. From repository root run `C:/Users/yvii/.dotnet/dotnet.exe build backend/SOMS.sln --nologo` and `C:/Users/yvii/.dotnet/dotnet.exe test backend/SOMS.sln --nologo`. Test accounts use generated passwords in memory and exercise unchanged `/api/auth/login`; no global auth bypass. The disposable schema fixture is recreated for each test invocation and disposed by the test fixture; these commands never apply the TV4 migration to the shared database.

Local evidence on 2026-11-18: `backend/SOMS.sln` build succeeded with 0 warnings/errors; test run on disposable PostgreSQL 17.12 at loopback port `55432` passed 37/37; the suite included WebApplicationFactory and Kestrel normal-login JWT authorization, tenant/permission/approval denial, payment verification/refund/exemption/replay, immutable refunded receipt, guardian notice dedup, asset loan/repair/recurrence/inventory and rejected irrelevant inventory date filter. A separate temporary (outside repository) finance export check parsed `.xlsx` with openpyxl and extracted PDF text with `pdftotext`; both contained the actual Vietnamese test student name and the filtered 20 VND payment. PDFsharp also reopened the PDF. No PDF/XLSX test binary is retained in the repository. This is isolated evidence, not a Supabase deployment check.

The backend contract is deployed only after the approved migration and real data-owner integration. TV2 owns student/class enrollment; TV1 owns login, RBAC and approvals; TV5 owns the parent/student portal and notification inbox. TV4 reads their existing normalized tables, writes in-app notifications through `public.notifications` and workflow decisions through existing workflow tables; it does not replace those modules. The current TV5 `StudentPortalService.GetFeesAsync` remains hardcoded and needs TV5's read integration before claiming parent-facing amounts are live. No frontend or shared database was modified during isolated verification.

## DOCX TV4 coverage

This matrix maps each DOCX requirement to its implemented backend route and storage. The isolated relational/HTTP suite checks representative success, failure, isolation, replay and export workflows; it does not separately exercise every row, migrate the shared database, integrate the TV5 portal, or deliver the frontend.

| Code | Backend route / evidence |
| --- | --- |
| ACC-01 | Shared `/api/auth/*`; `GET/PUT /api/finance/me` for own profile. |
| ACC-02 | `GET dashboard`; verified payment net and current debt. |
| ACC-03 | `GET/POST/PUT fee-categories`; `fee_types`. |
| ACC-04 | `GET/POST/PUT fee-campaigns`; `fee_campaigns`. |
| ACC-05 | `GET/PUT fee-campaigns/{id}/rules`; grade/class precedence. |
| ACC-06 | `POST fee-campaigns/{id}/assignments`; atomic `student_charges`, dedup and saved class. |
| ACC-07 | `GET/POST fee-assignments/{id}/exemptions`, approval decision; bounded discount. |
| ACC-08 | `GET/POST fee-campaigns/{id}/notices`; persisted draft. |
| ACC-09 | `POST notices/{id}/send`; verified guardian in-app rows. |
| ACC-10 | `GET fee-assignments`; real same-school student/class names and codes. |
| ACC-11 | `POST payments`; pending payment and allocation instructions. |
| ACC-12 | `POST bank-transactions/import`, `GET bank-transactions`; source-scoped dedup. |
| ACC-13 | `POST payments/reconcile`; exact bank amount/reference matching. |
| ACC-14 | `POST payments/{id}/verify`; once-only verified allocations. |
| ACC-15 | `GET debts`; outstanding charge/allocation balances. |
| ACC-16 | `GET debts?overdue=true`; due date and positive balance. |
| ACC-17 | `POST debts/{id}/reminder`; retry-key in-app delivery and real counts. |
| ACC-18 | `GET/POST adjustments`; pending workflow request/history. |
| ACC-19 | `POST adjustments/{id}/decision`, `/execute`; independent approver, once-only net refund. |
| ACC-20 | `POST receipts/{paymentId}`, `GET receipts/{id}`, `/download`; idempotent PDF. |
| ACC-21 | `GET payment-history`; names, class, actors, allocations, adjustments, history. |
| ACC-22 | `GET reports?classId=...`; class-filtered collected charges. |
| ACC-23 | `GET reports?academicYearId=...&semesterId=...`; real period filters. |
| ACC-24 | `GET reports?reportType=debt`; current debt, historical date filter rejected. |
| ACC-25 | `POST reports/export`; filtered XLSX/PDF attachment. |
| FAC-01 | Shared `/api/auth/*`; `GET/PUT /api/facility/me` own profile. |
| FAC-02 | `GET dashboard`; facility summary and incident groups. |
| FAC-03 | `GET/POST/PUT rooms`; school-scoped room status. |
| FAC-04 | `GET/POST/PUT assets/categories`; persisted categories, backfilled existing names. |
| FAC-05 | `POST assets`; shared assets + condition details/audit. |
| FAC-06 | `PUT assets/{id}`; validated room/category/status and audit. |
| FAC-07 | `POST assets/assign`; locked location change and audit. |
| FAC-08 | `GET assets`, `POST assets/{id}/condition`, `GET assets/{id}/history`. |
| FAC-09 | `GET/POST inventory`, `GET inventory/{id}`; actual counted observations/snapshot discrepancies. |
| FAC-10 | `GET borrow-requests`; shared `asset_loans` intake. |
| FAC-11 | `POST borrow-requests/{id}/handover`; locked active asset, actor/history. |
| FAC-12 | `POST borrow-requests/{id}/return`; condition/actor/history. |
| FAC-13 | `GET/POST incidents`; shared `asset_incidents`, teacher `workflow.submit`. |
| FAC-14 | `POST incidents/{id}/severity`; controlled priority. |
| FAC-15 | `POST repair-requests`; incident-linked maintenance job. |
| FAC-16 | `POST repair-requests/{id}/handler`; active same-school staff. |
| FAC-17 | `POST repair-requests/{id}/progress`; cannot mark complete. |
| FAC-18 | `POST repair-requests/{id}/result`; persisted cost/result/actor. |
| FAC-19 | `POST repair-requests/{id}/complete`; result required, incident/asset synchronized. |
| FAC-20 | `GET/POST maintenance`; recurring schedule and next occurrence. |
| FAC-21 | `POST maintenance/{id}/handler`, `/result`; assigned staff, completed result. |
| FAC-22 | `POST proposals` with `purchase`; TV1 workflow submission. |
| FAC-23 | `POST proposals` with `replacement`; existing asset required. |
| FAC-24 | `GET proposals`, `POST proposals/{id}/decision`; non-self management approval/history. |
| FAC-25 | `GET repair-history?assetId=...`; actor-attributed job history. |
| FAC-26 | `GET stats`; actual incident priority/status groups. |
| FAC-27 | `POST reports/export`; inventory/maintenance XLSX/PDF attachment. |
