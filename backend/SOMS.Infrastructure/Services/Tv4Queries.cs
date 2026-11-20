using SOMS.Application.Common.Models;
using static SOMS.Infrastructure.Services.Tv4Session;

namespace SOMS.Infrastructure.Services;

public static class Tv4Queries
{
    public static Task<Tv4Row> Profile(Tv4Session s) => s.One("SELECT p.id AS user_id,p.full_name,p.phone,p.avatar_path FROM public.profiles p WHERE p.id=@actor");
    public static async Task<Tv4Row> UpdateProfile(Tv4Session s, ProfileUpdate input)
    {
        var name = Required(input.FullName, nameof(input.FullName));
        var phone = Optional(input.Phone);
        if (phone?.Length > 30) throw new ArgumentException("Phone must not exceed 30 characters.");
        var before = await Profile(s);
        await s.Execute("UPDATE public.profiles SET full_name=@name,phone=@phone WHERE id=@actor", ("name", name), ("phone", phone));
        await s.Audit("profiles", s.ActorId, "profile_updated", before, input);
        return await Profile(s);
    }
    public static async Task<object> Lookups(Tv4Session s, LookupQuery query)
    {
        if (query.AcademicYearId.HasValue) await s.One("SELECT id FROM public.academic_years WHERE id=@id AND school_id=@school", ("id", query.AcademicYearId));
        if (query.GradeLevelId.HasValue) await s.One("SELECT id FROM public.grade_levels WHERE id=@id AND school_id=@school", ("id", query.GradeLevelId));
        if (query.ClassId.HasValue) await s.One("SELECT id FROM public.classes WHERE id=@id AND school_id=@school", ("id", query.ClassId));
        return new
        {
            AcademicYears = await s.Query("SELECT id,name,name AS code FROM public.academic_years WHERE school_id=@school ORDER BY start_date DESC"),
            Semesters = await s.Query("SELECT t.id,t.name,t.name AS code,t.academic_year_id FROM public.semesters t JOIN public.academic_years y ON y.id=t.academic_year_id WHERE y.school_id=@school AND (@year::uuid IS NULL OR t.academic_year_id=@year) ORDER BY t.ordinal", ("year", query.AcademicYearId)),
            Grades = await s.Query("SELECT id,grade_number::text AS code,'Khối '||grade_number AS name FROM public.grade_levels WHERE school_id=@school ORDER BY grade_number"),
            Classes = await s.Query("SELECT id,code,name,academic_year_id,grade_level_id FROM public.classes WHERE school_id=@school AND status='active' AND (@year::uuid IS NULL OR academic_year_id=@year) AND (@grade::uuid IS NULL OR grade_level_id=@grade) ORDER BY code", ("year", query.AcademicYearId), ("grade", query.GradeLevelId)),
            Students = await s.Query("SELECT st.id,st.student_code AS code,st.full_name AS name,c.id AS class_id,c.name AS class_name FROM public.students st LEFT JOIN LATERAL (SELECT cl.* FROM public.class_enrollments e JOIN public.classes cl ON cl.id=e.class_id AND cl.school_id=@school WHERE e.student_id=st.id AND e.status='active' AND (@year::uuid IS NULL OR cl.academic_year_id=@year) ORDER BY e.enrolled_on DESC LIMIT 1) c ON true WHERE st.school_id=@school AND st.status='enrolled' AND (@class::uuid IS NULL OR c.id=@class) AND (@grade::uuid IS NULL OR c.grade_level_id=@grade) AND (@search::text IS NULL OR st.full_name ILIKE '%'||@search||'%' OR st.student_code ILIKE '%'||@search||'%') ORDER BY st.student_code", ("year", query.AcademicYearId), ("class", query.ClassId), ("grade", query.GradeLevelId), ("search", Optional(query.Search)))
        };
    }
    public static Task<List<Tv4Row>> Handlers(Tv4Session s) => s.Query("SELECT id,user_id,employee_code AS code,full_name AS name FROM public.staff WHERE school_id=@school AND employment_status='active' ORDER BY full_name");
    public static Task<List<Tv4Row>> History(Tv4Session s, string table, Guid id) => s.Query("SELECT actor_id,operation,after_data,occurred_at FROM public.audit_logs WHERE school_id=@school AND table_name=@table AND row_id=@id ORDER BY occurred_at,id", ("table", table), ("id", id.ToString()));
}
