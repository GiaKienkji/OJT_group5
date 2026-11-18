const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');

const base = process.env.SOMS_DEMO_URL ?? 'http://localhost:5173';
const password = process.env.SOMS_ACADEMIC_DEMO_PASSWORD;
const executablePath = process.env.SOMS_CHROME_BIN;
if (!password || !executablePath) throw new Error('Set SOMS_ACADEMIC_DEMO_PASSWORD and SOMS_CHROME_BIN for the isolated demo.');
const { chromium } = require(process.env.SOMS_PLAYWRIGHT_MODULE ?? 'playwright-core');

const code = randomBytes(3).toString('hex').toUpperCase();
const firstClass = `6A-${code}`;
const secondClass = `6B-${code}`;
const student = `HS-${code}`;
const studentName = `Học sinh ${code}`;
const subject = `TOAN-${code}`;
const subjectName = `Toán ${code}`;
const weekday = (date) => {
  const value = new Date(date + 'T00:00:00Z').getUTCDay();
  return String(value === 0 ? 7 : value);
};

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' })
  .formatToParts(new Date()).filter(part => ['year', 'month', 'day'].includes(part.type))
  .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
const tomorrow = new Date(Date.UTC(Number(today.year), Number(today.month) - 1, Number(today.day) + 1))
  .toISOString().slice(0, 10);

function button(scope, name) {
  return scope.getByRole('button', { name, exact: true });
}
function row(scope, name) {
  return scope.getByRole('row').filter({ has: scope.getByRole('rowheader', { name, exact: true }) });
}
function select(scope, label) {
  return scope.locator('label').filter({ hasText: label }).locator('select');
}
async function login(browser, email) {
  const page = await browser.newPage({ timezoneId: 'Asia/Ho_Chi_Minh' });
  page.setDefaultTimeout(12000);
  await page.goto(new URL('/login', base).href);
  await page.getByPlaceholder('Nhập email hoặc mã tài khoản').fill(email);
  await page.getByPlaceholder('Nhập mật khẩu').fill(password);
  await button(page.locator('form'), 'Đăng nhập').click();
  await page.waitForURL(url => url.pathname.endsWith('/dashboard'));
  return page;
}

async function run() {
  const browser = await chromium.launch({ executablePath, headless: true });
  let page;
  try {
    page = await login(browser, 'giaovu@tv2-demo.invalid');
    const academic = page;
    await button(academic, 'Lớp học').click();
    for (const name of [firstClass, secondClass]) {
      await button(academic, 'Tạo lớp').click();
      await academic.getByLabel('Mã lớp', { exact: true }).fill(name);
      await academic.getByLabel('Tên lớp', { exact: true }).fill(name);
      await select(academic.locator('form'), 'Chọn khối').selectOption({ label: '6' });
      await academic.getByLabel('Sức chứa', { exact: true }).fill('1');
      await button(academic, 'Lưu lớp').click();
      await row(academic, name).waitFor();
    }

    await button(academic, 'Về trang Giáo vụ').click();
    await button(academic, 'Học sinh').click();
    await button(academic, 'Thêm học sinh').click();
    await academic.getByLabel('Mã học sinh', { exact: true }).fill(student);
    await academic.getByLabel('Họ tên', { exact: true }).fill(studentName);
    await button(academic, 'Lưu hồ sơ').click();
    await row(academic, student).waitFor();
    await academic.reload();
    await button(row(academic, student), 'Chi tiết').click();
    const profile = academic.getByRole('region', { name: 'Chi tiết hồ sơ' });
    await profile.getByLabel('Tìm tài khoản theo họ tên').fill('Học sinh Demo');
    await button(profile, 'Tìm tài khoản').click();
    await profile.locator('select').selectOption('60760000-0000-0000-0000-000000000014');
    await button(profile, 'Liên kết').click();
    await profile.getByText('Đã liên kết tài khoản học sinh.').waitFor();

    await button(academic, 'Về trang Giáo vụ').click();
    await button(academic, 'Lớp học').click();
    await button(row(academic, firstClass), 'Ghi danh').click();
    const roster = academic.getByRole('region', { name: `Ghi danh lớp ${firstClass}` });
    await roster.getByLabel('Tìm học sinh chưa có lớp').fill(student);
    await button(roster, 'Tìm học sinh').click();
    await roster.locator('select').first().selectOption({ label: `${student} · ${studentName}` });
    await button(roster, 'Ghi danh').click();
    await roster.getByRole('button', { name: `Chuyển lớp cho ${studentName}` }).click();
    await select(roster, 'Lớp đích cho').selectOption({ label: `${secondClass} · ${secondClass}` });
    await button(roster, 'Xác nhận chuyển').click();
    await roster.getByRole('cell', { name: 'Đã chuyển lớp' }).waitFor();
    console.log('Lớp, hồ sơ, liên kết tài khoản và chuyển lớp đạt.');

    await button(academic, 'Về trang Giáo vụ').click();
    await button(academic, 'Môn học').click();
    await button(academic, 'Thêm môn học').click();
    await academic.getByLabel('Mã môn', { exact: true }).fill(subject);
    await academic.getByLabel('Tên môn', { exact: true }).fill(subjectName);
    await button(academic, 'Lưu môn học').click();
    await row(academic, subject).waitFor();
    await button(academic, 'Về trang Giáo vụ').click();
    await button(academic, 'Lớp học').click();
    await button(row(academic, secondClass), 'Phân công').click();
    const assignments = academic.getByRole('region', { name: `Phân công lớp ${secondClass}` });
    await assignments.getByLabel('Tìm môn đang hoạt động').fill(subject);
    await button(assignments, 'Tìm môn').click();
    await select(assignments, 'Môn để thêm').selectOption({ label: `${subject} · ${subjectName}` });
    await button(assignments, 'Thêm vào chương trình').click();
    await button(assignments, 'Lưu chương trình').click();
    await assignments.getByText('Đã lưu chương trình.').waitFor();
    await button(assignments, 'Thêm phân công').click();
    const assignmentForm = assignments.locator('form').filter({ hasText: 'Lưu phân công' });
    await select(assignmentForm, 'Môn học').selectOption({ label: subjectName });
    await select(assignmentForm, 'Giáo viên').selectOption({ label: 'GVDEMO1 · Giáo viên Demo' });
    await select(assignmentForm, 'Trạng thái').selectOption('active');
    await button(assignments, 'Lưu phân công').click();
    await assignments.getByText('Đã lưu phân công.').waitFor();
    await select(assignments, 'Chủ nhiệm mới').selectOption({ label: 'GVDEMO1 · Giáo viên Demo' });
    await button(assignments, 'Phân công chủ nhiệm').click();
    await assignments.getByText('Đã cập nhật chủ nhiệm.').waitFor();
    console.log('Chương trình, phân công và chủ nhiệm đạt.');

    await button(academic, 'Về trang Giáo vụ').click();
    await button(academic, 'Thời khóa biểu').click();
    const selectSemester = page => select(page, 'Chọn học kỳ').selectOption('60760000-0000-0000-0000-000000000021');
    await selectSemester(academic);
    await button(academic, 'Tạo bản nháp').click();
    await button(academic, 'Thêm ô lịch').click();
    const form = academic.locator('form').filter({ hasText: 'Lưu ô lịch' });
    await select(form, 'Phân công').selectOption({ label: `${secondClass} · ${subjectName} · Giáo viên Demo` });
    await select(form, 'Ngày trong tuần').selectOption(weekday(tomorrow));
    await select(form, 'Tiết').selectOption('60760000-0000-0000-0000-000000000051');
    await select(form, 'Phòng').selectOption({ label: 'P101' });
    await button(form, 'Lưu ô lịch').click();
    await academic.getByText('Đã lưu ô lịch.').waitFor();
    await button(academic, 'Gửi duyệt').click();
    await academic.getByText('Đã gửi duyệt.').waitFor();

    page = await login(browser, 'bgh@tv2-demo.invalid');
    const review = page;
    await button(review, 'Duyệt thời khóa biểu').click();
    await selectSemester(review);
    await select(review, 'Phiên bản').selectOption({ label: 'Bản 1 · Chờ duyệt' });
    await button(review, 'Duyệt').click();
    await review.getByText('Đã duyệt phiên bản.').waitFor();

    page = academic;
    await academic.reload();
    await selectSemester(academic);
    await select(academic, 'Phiên bản').selectOption({ label: 'Bản 1 · Chờ duyệt' });
    await button(academic, 'Công bố').click();
    await academic.getByText('Đã công bố lịch.').waitFor();
    console.log('Tạo lịch, gửi duyệt qua tài khoản Ban giám hiệu và công bố đạt.');

    page = await login(browser, 'hocsinh@tv2-demo.invalid');
    const studentPage = page;
    await studentPage.goto(new URL('/student/timetable', base).href);
    const study = studentPage.getByRole('region', { name: 'Lịch công bố' });
    await study.getByRole('cell', { name: subjectName, exact: true }).waitFor();

    page = academic;
    await button(academic, 'Về tổng quan').click();
    await button(academic, 'Dạy thay và kiểm tra').click();
    const substitute = academic.getByRole('region', { name: 'Dạy thay' });
    await substitute.getByLabel('Ngày dạy thay').fill(tomorrow);
    const slot = select(substitute, 'Ca học');
    const slotLabel = `07:00 · ${secondClass} · ${subjectName} · Giáo viên Demo`;
    await slot.selectOption({ label: slotLabel });
    await button(substitute, 'Tìm giáo viên rảnh').click();
    await select(substitute, 'Giáo viên dạy thay').selectOption({ label: 'GVDEMO2 · Giáo viên Dạy thay' });
    await button(substitute, 'Xác nhận dạy thay').click();
    await substitute.getByText('Đã bố trí ca dạy thay.').waitFor();

    const exams = academic.getByRole('region', { name: 'Lịch kiểm tra' });
    await select(exams, 'Học kỳ kiểm tra').selectOption('60760000-0000-0000-0000-000000000021');
    await button(exams, 'Thêm ca kiểm tra').click();
    await select(exams, 'Lớp kiểm tra').selectOption({ label: `${secondClass} · ${secondClass}` });
    await select(exams, 'Môn kiểm tra').selectOption({ label: `${subject} · ${subjectName}` });
    await select(exams, 'Phòng kiểm tra').selectOption({ label: 'P101' });
    await exams.getByLabel('Bắt đầu theo giờ thiết bị').fill(tomorrow + 'T09:00');
    await exams.getByLabel('Kết thúc theo giờ thiết bị').fill(tomorrow + 'T10:00');
    await button(exams, 'Lưu lịch kiểm tra').click();
    await button(exams, 'Công bố').click();
    await exams.getByText('Đã công bố ca kiểm tra.').waitFor();

    page = studentPage;
    await studentPage.reload();
    await study.getByRole('cell', { name: 'Dạy thay', exact: true }).waitFor();
    await study.getByRole('cell', { name: 'Kiểm tra', exact: true }).waitFor();
    assert.equal(await study.getByRole('cell', { name: subjectName, exact: true }).count(), 2);
    console.log('Portal học sinh hiển thị tiết dạy thay và ca kiểm tra đã công bố.');
  } catch (error) {
    console.error(error.message);
    if (page) console.error('Trang lỗi: ' + new URL(page.url()).pathname);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void run();
