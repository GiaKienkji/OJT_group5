using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using SOMS.Application.Modules.StudentPortal.DTOs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using SOMS.Application.Modules.Academic;
using SOMS.Infrastructure.Data;
using Xunit;

namespace SOMS.UnitTests;

public sealed class AcademicPostgresTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [AcademicPostgresFact]
    public async Task SchoolScopeAndConcurrentEnrollmentPreserveCapacityAndHistory()
    {
        var connection = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("SOMS_ACADEMIC_TEST_DB"));
        Assert.Equal("127.0.0.1", connection.Host);
        Assert.Contains(connection.Database, new[] { "academic_m0_test", "academic_baseline_test" });
        await using var database = new NpgsqlConnection(connection.ConnectionString);
        await database.OpenAsync();

        var school = Guid.NewGuid();
        var otherSchool = Guid.NewGuid();
        var actor = Guid.NewGuid();
        var role = $"fixture_{school:N}";
        var year = Guid.NewGuid();
        var grade = Guid.NewGuid();
        var origin = Guid.NewGuid();
        var target = Guid.NewGuid();
        var foreignClass = Guid.NewGuid();
        var otherYear = Guid.NewGuid();
        var otherGrade = Guid.NewGuid();
        var firstStudent = Guid.NewGuid();
        var secondStudent = Guid.NewGuid();
        var studentAccount = Guid.NewGuid();
        var otherAccount = Guid.NewGuid();
        var semester = Guid.NewGuid();
        var teacher = Guid.NewGuid();
        var secondTeacher = Guid.NewGuid();
        var foreignTeacher = Guid.NewGuid();
        var reviewer = Guid.NewGuid();
        var reviewerRole = $"review_{school:N}";
        var room = Guid.NewGuid();
        var firstPeriod = Guid.NewGuid();
        var overlapPeriod = Guid.NewGuid();

        await Execute(database, $"""
            INSERT INTO public.schools (id, code, name, timezone)
            VALUES ('{school}', '{school}', 'School A', 'Asia/Ho_Chi_Minh'),
                   ('{otherSchool}', '{otherSchool}', 'School B', 'America/Los_Angeles');
            INSERT INTO auth.users (id) VALUES ('{actor}'), ('{studentAccount}'), ('{otherAccount}'), ('{reviewer}');
            INSERT INTO public.profiles (id, full_name)
            VALUES ('{actor}', 'Academic staff'), ('{studentAccount}', 'Học Sinh Kiểm Thử'), ('{otherAccount}', 'Học Sinh Kiểm Thử'),
                   ('{reviewer}', 'Reviewer');
            INSERT INTO public.roles (code, name_vi) VALUES ('{role}', 'Academic test'), ('student', 'Student'), ('{reviewerRole}', 'Reviewer')
            ON CONFLICT (code) DO NOTHING;
            INSERT INTO public.permissions (code, description)
            VALUES ('academic.manage', 'Context'), ('classes.manage', 'Classes'), ('students.manage', 'Students'),
                   ('subjects.manage', 'Subjects'), ('teaching_assignments.manage', 'Teaching'), ('homeroom.assign', 'Homeroom'),
                   ('timetables.draft', 'Draft'), ('timetables.approve', 'Approve'), ('timetables.publish', 'Publish'),
                   ('exams.manage', 'Exams'), ('scheduling.manage', 'Substitutions'), ('student_timetable.view', 'View Calendar')
            ON CONFLICT (code) DO NOTHING;
            INSERT INTO public.role_permissions (role_code, permission_code)
            VALUES ('{role}', 'academic.manage'), ('{role}', 'classes.manage'), ('{role}', 'students.manage'),
                   ('{role}', 'subjects.manage'), ('{role}', 'teaching_assignments.manage'), ('{role}', 'homeroom.assign'),
                   ('{role}', 'timetables.draft'), ('{role}', 'timetables.publish'), ('{role}', 'timetables.approve'),
                   ('{reviewerRole}', 'timetables.approve'), ('{role}', 'exams.manage'), ('{role}', 'scheduling.manage'),
                   ('student', 'student_timetable.view') ON CONFLICT DO NOTHING;
            INSERT INTO public.school_memberships (school_id, user_id, role_code, valid_from, valid_to)
            VALUES ('{school}', '{actor}', '{role}', DATE '2026-11-19', DATE '2026-11-19'),
                   ('{otherSchool}', '{actor}', '{role}', DATE '2026-11-19', NULL),
                   ('{school}', '{studentAccount}', 'student', NULL, NULL),
                   ('{otherSchool}', '{otherAccount}', 'student', NULL, NULL),
                   ('{school}', '{reviewer}', '{reviewerRole}', NULL, NULL);
            INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, status)
            VALUES ('{year}', '{school}', '2026–2027', DATE '2026-09-01', DATE '2027-05-31', 'active'),
                   ('{otherYear}', '{otherSchool}', '2026–2027', DATE '2026-09-01', DATE '2027-05-31', 'active');
            INSERT INTO public.semesters (id, academic_year_id, name, ordinal, start_date, end_date, status)
            VALUES ('{semester}', '{year}', 'Semester I', 1, DATE '2026-09-01', DATE '2026-12-31', 'active');
            INSERT INTO public.staff (id, school_id, employee_code, full_name, kind)
            VALUES ('{teacher}', '{school}', 'GV01', 'Teacher One', 'teacher'),
                   ('{secondTeacher}', '{school}', 'GV02', 'Teacher Two', 'teacher'),
                   ('{foreignTeacher}', '{otherSchool}', 'GV03', 'Foreign Teacher', 'teacher');
            INSERT INTO public.rooms (id, school_id, code, capacity) VALUES ('{room}', '{school}', 'P101', 20);
            INSERT INTO public.period_definitions (id, school_id, period_no, starts_at, ends_at)
            VALUES ('{firstPeriod}', '{school}', 1, TIME '07:00', TIME '08:00'),
                   ('{overlapPeriod}', '{school}', 2, TIME '07:30', TIME '08:30');
            INSERT INTO public.grade_levels (id, school_id, grade_number)
            VALUES ('{grade}', '{school}', 6), ('{otherGrade}', '{otherSchool}', 6);
            INSERT INTO public.classes (id, school_id, academic_year_id, grade_level_id, code, name, capacity)
            VALUES ('{origin}', '{school}', '{year}', '{grade}', '6A', '6A', 1),
                   ('{target}', '{school}', '{year}', '{grade}', '6B', '6B', 1),
                   ('{foreignClass}', '{otherSchool}', '{otherYear}', '{otherGrade}', '6A', '6A', 1);
            INSERT INTO public.students (id, school_id, student_code, full_name)
            VALUES ('{firstStudent}', '{school}', 'HS01', 'First Student'),
                   ('{secondStudent}', '{school}', 'HS02', 'Second Student');
            """);

        var key = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(32));
        using var host = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureTestServices(services =>
            {
                services.AddScoped(_ => new SomsDbContext(new DbContextOptionsBuilder<SomsDbContext>()
                    .UseNpgsql(connection.ConnectionString, options => options.EnableRetryOnFailure()).Options));
                services.AddSingleton<TimeProvider>(new SchoolClock());
                services.PostConfigure<JwtBearerOptions>("Bearer", options =>
                {
                    options.TokenValidationParameters.IssuerSigningKey = key;
                    options.TokenValidationParameters.ValidIssuer = "fixture";
                    options.TokenValidationParameters.ValidAudience = "fixture";
                });
            });
        });
        using var api = host.CreateClient();
        SignIn(api, actor, key);
        using var reviewApi = host.CreateClient();
        SignIn(reviewApi, reviewer, key);

        var context = Assert.Single((await api.GetFromJsonAsync<AcademicSchool[]>("/api/academic/context"))!);
        Assert.Equal(school, context.Id);
        Assert.Equal(HttpStatusCode.Forbidden, (await api.GetAsync($"/api/academic/classes?schoolId={otherSchool}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await api.GetAsync($"/api/academic/classes/{foreignClass}?schoolId={school}")).StatusCode);
        var empty = await api.GetFromJsonAsync<ClassRoster>($"/api/academic/classes/{origin}/enrollments");
        Assert.Empty(empty!.Items);

        var duplicate = await api.PostAsJsonAsync("/api/academic/classes", new ClassInput("6a", "Duplicate", year, grade, 1, null));
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        var badGrade = await api.PostAsJsonAsync("/api/academic/classes", new ClassInput("6c", "Wrong grade", year, otherGrade, null, null));
        Assert.Equal(HttpStatusCode.BadRequest, badGrade.StatusCode);
        var created = await api.PostAsJsonAsync("/api/academic/classes", new ClassInput("6c", "New class", year, grade, null, null));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var newClass = (await created.Content.ReadFromJsonAsync<ClassRow>())!;
        var list = (await api.GetFromJsonAsync<ClassPage>($"/api/academic/classes?academicYearId={year}&search=6C"))!;
        Assert.Equal(newClass.Id, Assert.Single(list.Items).Id);
        var stale = await api.PutAsJsonAsync($"/api/academic/classes/{newClass.Id}",
            new ClassInput("6c", "Stale update", year, grade, null, 0));
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await api.PostAsJsonAsync($"/api/academic/classes/{newClass.Id}/archive",
            new RevisionInput(newClass.Revision))).StatusCode);

        var subjectResponse = await api.PostAsJsonAsync("/api/academic/subjects", new SubjectInput(" mth ", "Math"));
        Assert.Equal(HttpStatusCode.Created, subjectResponse.StatusCode);
        var subject = (await subjectResponse.Content.ReadFromJsonAsync<SubjectRow>())!;
        Assert.Equal("MTH", subject.Code);
        Assert.Equal(HttpStatusCode.Conflict, (await api.PostAsJsonAsync("/api/academic/subjects",
            new SubjectInput("mth", "Duplicate"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await api.PutAsJsonAsync($"/api/academic/subjects/{subject.Id}",
            new SubjectInput("MTH", "Math", false, subject.Revision))).StatusCode);
        var inactive = (await api.GetFromJsonAsync<SubjectPage>("/api/academic/subjects?isActive=false"))!;
        Assert.Equal(subject.Id, Assert.Single(inactive.Items).Id);

        var curriculumSubject = (await (await api.PostAsJsonAsync("/api/academic/subjects",
            new SubjectInput("SCI", "Science"))).Content.ReadFromJsonAsync<SubjectRow>())!;
        var curriculumPath = $"/api/academic/classes/{origin}/subjects";
        var setup = await api.PutAsJsonAsync(curriculumPath,
            new CurriculumInput(semester, [new ClassSubjectInput(curriculumSubject.Id, 2)]));
        Assert.Equal(HttpStatusCode.OK, setup.StatusCode);
        Assert.Equal(2, Assert.Single((await api.GetFromJsonAsync<ClassSubjectRow[]>($"{curriculumPath}?semesterId={semester}"))!).WeeklyPeriods);
        var teachers = (await api.GetFromJsonAsync<TeacherOption[]>($"/api/academic/teachers?semesterId={semester}"))!;
        Assert.Equal(2, teachers.Length);
        Assert.DoesNotContain(teachers, item => item.Id == foreignTeacher);

        var assignment = new TeachingAssignmentInput(origin, curriculumSubject.Id, teacher, semester, 2, "active", null);
        Assert.Equal(HttpStatusCode.BadRequest, (await api.PostAsJsonAsync("/api/academic/teaching-assignments",
            assignment with { StaffId = foreignTeacher })).StatusCode);
        var assignmentResponse = await api.PostAsJsonAsync("/api/academic/teaching-assignments", assignment);
        Assert.Equal(HttpStatusCode.Created, assignmentResponse.StatusCode);
        var savedAssignment = (await assignmentResponse.Content.ReadFromJsonAsync<TeachingAssignmentRow>())!;
        Assert.Equal(HttpStatusCode.Conflict, (await api.PostAsJsonAsync("/api/academic/teaching-assignments",
            assignment with { StaffId = secondTeacher })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await api.PutAsJsonAsync(curriculumPath,
            new CurriculumInput(semester, []))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await api.PostAsJsonAsync($"/api/academic/teaching-assignments/{savedAssignment.Id}/archive",
            new RevisionInput(savedAssignment.Revision))).StatusCode);

        var homeroomPath = $"/api/academic/classes/{origin}/homeroom-assignments";
        var initialHomeroom = (await api.GetFromJsonAsync<HomeroomHistory>(homeroomPath))!;
        Assert.Empty(initialHomeroom.Items);
        var homeroomResponse = await api.PostAsJsonAsync(homeroomPath, new HomeroomInput(teacher, initialHomeroom.ClassRevision));
        Assert.Equal(HttpStatusCode.OK, homeroomResponse.StatusCode);
        var homeroom = (await homeroomResponse.Content.ReadFromJsonAsync<HomeroomHistory>())!;
        var replaceHomeroom = await api.PostAsJsonAsync(homeroomPath, new HomeroomInput(secondTeacher, homeroom.ClassRevision));
        Assert.Equal(HttpStatusCode.OK, replaceHomeroom.StatusCode);
        var homeroomItems = (await replaceHomeroom.Content.ReadFromJsonAsync<HomeroomHistory>())!.Items;
        Assert.Equal(secondTeacher, Assert.Single(homeroomItems, item => item.EndsBefore == null).StaffId);
        Assert.Equal(teacher, Assert.Single(homeroomItems, item => item.EndsBefore != null).StaffId);

        var profiles = await api.GetFromJsonAsync<StudentProfileOption[]>($"/api/academic/students/profile-options?search={Uri.EscapeDataString("HỌC SINH")}");
        Assert.Equal(studentAccount, Assert.Single(profiles!).Id);
        var profile = (await api.GetFromJsonAsync<StudentRow>($"/api/academic/students/{firstStudent}"))!;
        Assert.Equal(HttpStatusCode.BadRequest, (await api.PutAsJsonAsync($"/api/academic/students/{firstStudent}/profile",
            new StudentProfileLink(otherAccount, profile.Revision))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await api.PutAsJsonAsync($"/api/academic/students/{firstStudent}/profile",
            new StudentProfileLink(studentAccount, profile.Revision))).StatusCode);

        var attempts = await Task.WhenAll(
            api.PostAsJsonAsync($"/api/academic/classes/{origin}/enrollments", new EnrollmentInput(firstStudent)),
            api.PostAsJsonAsync($"/api/academic/classes/{origin}/enrollments", new EnrollmentInput(secondStudent)));
        Assert.Single(attempts, result => result.StatusCode == HttpStatusCode.Conflict);
        var enrolled = Assert.Single(attempts, result => result.StatusCode == HttpStatusCode.Created);
        var old = (await enrolled.Content.ReadFromJsonAsync<EnrollmentRow>())!;
        Assert.Equal(new DateOnly(2026, 11, 19), old.EnrolledOn);
        var classRow = (await api.GetFromJsonAsync<ClassRow>($"/api/academic/classes/{origin}"))!;
        Assert.Equal(HttpStatusCode.Conflict, (await api.PostAsJsonAsync($"/api/academic/classes/{origin}/archive",
            new RevisionInput(classRow.Revision))).StatusCode);

        var failingAudit = $"audit_fixture_{school:N}";
        await Execute(database, $"ALTER TABLE public.audit_logs ADD CONSTRAINT {failingAudit} CHECK (school_id <> '{school}')");
        try
        {
            var failure = await Assert.ThrowsAsync<PostgresException>(() =>
                api.PostAsJsonAsync($"/api/academic/enrollments/{old.Id}/transfer", new TransferInput(target)));
            Assert.Equal(PostgresErrorCodes.CheckViolation, failure.SqlState);
        }
        finally
        {
            await Execute(database, $"ALTER TABLE public.audit_logs DROP CONSTRAINT {failingAudit}");
        }
        var rolledBack = (await api.GetFromJsonAsync<ClassRoster>($"/api/academic/classes/{origin}/enrollments"))!;
        Assert.Equal("active", Assert.Single(rolledBack.Items).Status);
        Assert.Empty((await api.GetFromJsonAsync<ClassRoster>($"/api/academic/classes/{target}/enrollments"))!.Items);

        var move = await api.PostAsJsonAsync($"/api/academic/enrollments/{old.Id}/transfer", new TransferInput(target));
        Assert.Equal(HttpStatusCode.Created, move.StatusCode);
        var oldRoster = (await api.GetFromJsonAsync<ClassRoster>($"/api/academic/classes/{origin}/enrollments"))!;
        var history = Assert.Single(oldRoster.Items);
        Assert.Equal(0, oldRoster.ActiveCount);
        Assert.Equal("moved", history.Status);
        Assert.Equal(old.EnrolledOn, history.LeftOn);
        var newRoster = (await api.GetFromJsonAsync<ClassRoster>($"/api/academic/classes/{target}/enrollments"))!;
        Assert.Equal(1, newRoster.ActiveCount);
        Assert.Equal(old.StudentId, Assert.Single(newRoster.Items).StudentId);
        await using var audit = new NpgsqlCommand($"SELECT count(*) FROM public.audit_logs WHERE school_id = '{school}'", database);
        Assert.Equal(1L, await audit.ExecuteScalarAsync());

        var scheduledResponse = await api.PostAsJsonAsync("/api/academic/teaching-assignments",
            assignment with { StaffId = secondTeacher, WeeklyPeriods = 1 });
        Assert.Equal(HttpStatusCode.Created, scheduledResponse.StatusCode);
        var scheduled = (await scheduledResponse.Content.ReadFromJsonAsync<TeachingAssignmentRow>())!;
        var versionResponse = await api.PostAsJsonAsync("/api/academic/timetables", new TimetableInput(semester));
        Assert.Equal(HttpStatusCode.Created, versionResponse.StatusCode);
        var timetable = (await versionResponse.Content.ReadFromJsonAsync<TimetableDetail>())!;
        var path = $"/api/academic/timetables/{timetable.Version.Id}";

        var suggestions = (await api.GetFromJsonAsync<TimetableSuggestion[]>($"{path}/suggestions?assignmentId={scheduled.Id}&weekday=4"))!;
        Assert.All(suggestions, item => Assert.Equal(scheduled.Id, item.TeachingAssignmentId));
        Assert.Contains(suggestions, item => item.RoomId == room && item.PeriodId == firstPeriod);
        var input = new TimetableSlotInput(scheduled.Id, room, firstPeriod, 4, timetable.Version.Revision);
        var writes = await Task.WhenAll(api.PostAsJsonAsync($"{path}/entries", input), api.PostAsJsonAsync($"{path}/entries", input));
        Assert.Single(writes, result => result.StatusCode == HttpStatusCode.Conflict);
        var added = (await Assert.Single(writes, result => result.StatusCode == HttpStatusCode.OK)
            .Content.ReadFromJsonAsync<TimetableDetail>())!;
        Assert.Single(added.Items);
        var overlap = input with { PeriodId = overlapPeriod, Revision = added.Version.Revision };
        var checkedSlot = (await (await api.PostAsJsonAsync($"{path}/check-conflicts", overlap))
            .Content.ReadFromJsonAsync<TimetableCheck>())!;
        Assert.Equal(new[] { "class", "teacher", "room" }, checkedSlot.Conflicts.Select(item => item.Resource));
        Assert.Equal(HttpStatusCode.Conflict, (await api.PostAsJsonAsync($"{path}/entries", overlap)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict,
            (await api.PostAsJsonAsync($"{path}/publish", new TimetablePublishInput(added.Version.Revision))).StatusCode);

        var today = new DateOnly(2026, 11, 19);
        var scheduleQuery = $"/api/academic/schedule?from={today:yyyy-MM-dd}&to={today:yyyy-MM-dd}";
        Assert.Empty((await api.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!);

        var submittedResponse = await api.PostAsJsonAsync($"{path}/submit", new RevisionInput(added.Version.Revision));
        Assert.Equal(HttpStatusCode.OK, submittedResponse.StatusCode);
        var submitted = (await submittedResponse.Content.ReadFromJsonAsync<TimetableDetail>())!;
        Assert.Equal("pending_approval", submitted.Version.Status);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await api.PostAsJsonAsync($"{path}/approve", new RevisionInput(submitted.Version.Revision))).StatusCode);
        var approvedResponse = await reviewApi.PostAsJsonAsync($"{path}/approve", new RevisionInput(submitted.Version.Revision));
        Assert.Equal(HttpStatusCode.OK, approvedResponse.StatusCode);
        var approved = (await approvedResponse.Content.ReadFromJsonAsync<TimetableDetail>())!;
        Assert.Equal(approved.Version.ContentRevision, approved.Version.ApprovedRevision);
        var publishedResponse = await api.PostAsJsonAsync($"{path}/publish", new TimetablePublishInput(approved.Version.Revision));
        Assert.Equal(HttpStatusCode.OK, publishedResponse.StatusCode);
        var published = (await publishedResponse.Content.ReadFromJsonAsync<TimetableDetail>())!;
        Assert.Equal("published", published.Version.Status);
        Assert.Equal(HttpStatusCode.Conflict, (await api.PostAsJsonAsync($"{path}/entries",
            input with { Revision = published.Version.Revision })).StatusCode);
        var clonedResponse = await api.PostAsync($"{path}/clone", null);
        Assert.Equal(HttpStatusCode.Created, clonedResponse.StatusCode);
        var cloned = (await clonedResponse.Content.ReadFromJsonAsync<TimetableDetail>())!;
        Assert.NotEqual(Assert.Single(published.Items).Id, Assert.Single(cloned.Items).Id);
        Assert.Equal("draft", cloned.Version.Status);
        var lesson = Assert.Single((await api.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!);
        Assert.Equal(Assert.Single(published.Items).Id, lesson.Id);
        Assert.Equal(secondTeacher, lesson.StaffId);

        using var externalStudent = host.CreateClient();
        SignIn(externalStudent, otherAccount, key);
        Assert.Equal(HttpStatusCode.Forbidden, (await externalStudent.GetAsync($"{scheduleQuery}&schoolId={school}")).StatusCode);
        Assert.Empty((await externalStudent.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!);

        var account = Guid.NewGuid();
        var portalStudent = Guid.NewGuid();
        await Execute(database, $"""
            INSERT INTO auth.users (id) VALUES ('{account}');
            INSERT INTO public.profiles (id, full_name) VALUES ('{account}', 'Portal Pupil');
            INSERT INTO public.school_memberships (school_id, user_id, role_code) VALUES ('{school}', '{account}', 'student');
            INSERT INTO public.students (id, school_id, user_id, student_code, full_name)
            VALUES ('{portalStudent}', '{school}', '{account}', 'PORTAL', 'Portal Pupil');
            INSERT INTO public.class_enrollments (id, class_id, student_id, enrolled_on)
            VALUES (gen_random_uuid(), '{origin}', '{portalStudent}', DATE '2026-11-19');
            """);
        using var studentApi = host.CreateClient();
        SignIn(studentApi, account, key);
        Assert.Equal(lesson.Id, Assert.Single((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!).Id);
        Assert.Single((await studentApi.GetFromJsonAsync<TimetableItemDto[]>("/api/student/timetable"))!);

        var candidates = (await api.GetFromJsonAsync<TeacherOption[]>(
            $"/api/academic/sessions/{lesson.Id}/substitute-candidates?onDate={today:yyyy-MM-dd}"))!;
        Assert.Equal(teacher, Assert.Single(candidates).Id);
        var proposed = await api.PostAsJsonAsync("/api/academic/substitutions", new SubstitutionInput(lesson.Id, today, teacher));
        Assert.Equal(HttpStatusCode.OK, proposed.StatusCode);
        var substitution = (await proposed.Content.ReadFromJsonAsync<SubstitutionRow>())!;
        Assert.Equal(teacher, Assert.Single((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!).StaffId);
        Assert.Equal(HttpStatusCode.OK, (await api.PostAsync($"/api/academic/substitutions/{substitution.Id}/cancel", null)).StatusCode);
        Assert.Equal(secondTeacher, Assert.Single((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!).StaffId);

        var exam = new ExamInput(origin, curriculumSubject.Id, semester, lesson.StartsAt, lesson.EndsAt, room, null);
        Assert.Equal(HttpStatusCode.Conflict, (await api.PostAsJsonAsync("/api/academic/exams", exam)).StatusCode);
        var examResponse = await api.PostAsJsonAsync("/api/academic/exams", exam with
        {
            StartsAt = lesson.EndsAt, EndsAt = lesson.EndsAt.AddHours(1)
        });
        Assert.Equal(HttpStatusCode.Created, examResponse.StatusCode);
        var draftExam = (await examResponse.Content.ReadFromJsonAsync<ExamRow>())!;
        Assert.Single((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!);
        var examPublishedResponse = await api.PostAsJsonAsync($"/api/academic/exams/{draftExam.Id}/publish",
            new RevisionInput(draftExam.Revision));
        Assert.Equal(HttpStatusCode.OK, examPublishedResponse.StatusCode);
        var examPublished = (await examPublishedResponse.Content.ReadFromJsonAsync<ExamRow>())!;
        Assert.Contains((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!,
            item => item.Kind == "exam" && item.Id == examPublished.Id);
        Assert.Equal(examPublished.Id, Assert.Single((await studentApi.GetFromJsonAsync<ExamItemDto[]>("/api/student/exams"))!).Id);
        Assert.Equal(HttpStatusCode.OK, (await api.PostAsJsonAsync($"/api/academic/exams/{draftExam.Id}/cancel",
            new RevisionInput(examPublished.Revision))).StatusCode);
        Assert.Single((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!);

        var clonePath = $"/api/academic/timetables/{cloned.Version.Id}";
        var nextSubmit = await api.PostAsJsonAsync($"{clonePath}/submit", new RevisionInput(cloned.Version.Revision));
        var nextPending = (await nextSubmit.Content.ReadFromJsonAsync<TimetableDetail>())!;
        var nextApprove = await reviewApi.PostAsJsonAsync($"{clonePath}/approve", new RevisionInput(nextPending.Version.Revision));
        var nextApproved = (await nextApprove.Content.ReadFromJsonAsync<TimetableDetail>())!;
        var nextPublish = await api.PostAsJsonAsync($"{clonePath}/publish", new TimetablePublishInput(nextApproved.Version.Revision));
        Assert.Equal(HttpStatusCode.OK, nextPublish.StatusCode);
        var next = (await nextPublish.Content.ReadFromJsonAsync<TimetableDetail>())!;
        Assert.Equal(today.AddDays(1), next.Version.EffectiveFrom);
        Assert.Equal(lesson.Id, Assert.Single((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(scheduleQuery))!).Id);
        var nextWeek = today.AddDays(7);
        var nextQuery = $"/api/academic/schedule?from={nextWeek:yyyy-MM-dd}&to={nextWeek:yyyy-MM-dd}";
        Assert.Equal(Assert.Single(cloned.Items).Id,
            Assert.Single((await studentApi.GetFromJsonAsync<ScheduleOccurrence[]>(nextQuery))!).Id);

        using var overview = await api.GetFromJsonAsync<JsonDocument>($"/api/academic/dashboard?semesterId={semester}");
        Assert.Equal(1, overview!.RootElement.GetProperty("unmetAssignments").GetInt32());

        await Execute(database, $"UPDATE public.school_memberships SET valid_from = NULL WHERE school_id = '{otherSchool}' AND user_id = '{actor}'");
        Assert.Equal(2, (await api.GetFromJsonAsync<AcademicSchool[]>("/api/academic/context"))!.Length);
        Assert.Equal(HttpStatusCode.BadRequest, (await api.GetAsync("/api/academic/classes")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await api.GetAsync($"/api/academic/classes?schoolId={otherSchool}")).StatusCode);

        await Execute(database, $"DELETE FROM public.role_permissions WHERE role_code = '{role}' AND permission_code = 'classes.manage'");
        Assert.Equal(HttpStatusCode.Forbidden, (await api.PostAsJsonAsync($"/api/academic/classes/{origin}/enrollments?schoolId={school}",
            new EnrollmentInput(secondStudent))).StatusCode);
    }

    private static void SignIn(HttpClient client, Guid user, SymmetricSecurityKey key)
    {
        var token = new JwtSecurityToken("fixture", "fixture", new[] { new Claim(ClaimTypes.NameIdentifier, user.ToString()) },
            expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
    }

    private static async Task Execute(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    private sealed class SchoolClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 18, 18, 0, 0, TimeSpan.Zero);
    }
}

public sealed class AcademicPostgresFactAttribute : FactAttribute
{
    public AcademicPostgresFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SOMS_ACADEMIC_TEST_DB")))
            Skip = "Set SOMS_ACADEMIC_TEST_DB to the isolated PostgreSQL academic_m0_test fixture.";
    }
}
