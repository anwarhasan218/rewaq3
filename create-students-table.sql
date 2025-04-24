-- حذف الجدول إذا كان موجودًا
DROP TABLE IF EXISTS public.students;

-- إنشاء جدول الطلاب
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    national_id TEXT NOT NULL,
    passport_number TEXT,
    phone_number TEXT NOT NULL,
    gender TEXT NOT NULL,
    age INTEGER NOT NULL,
    governorate TEXT NOT NULL,
    residence_address TEXT NOT NULL,
    educational_qualification TEXT NOT NULL,
    education_type TEXT NOT NULL,
    occupation TEXT,
    work_place TEXT,
    college TEXT,
    academic_year TEXT,
    level TEXT NOT NULL,
    specialized_department TEXT,
    doctrine TEXT NOT NULL,
    attendance_system TEXT NOT NULL,
    special_needs BOOLEAN DEFAULT FALSE,
    payment_reference_number TEXT NOT NULL,
    id_card_image TEXT NOT NULL,
    qualification_image TEXT,
    payment_receipt_image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- إنشاء فهرس على الرقم القومي
CREATE INDEX IF NOT EXISTS students_national_id_idx ON public.students (national_id);

-- إنشاء فهرس على تاريخ الإنشاء
CREATE INDEX IF NOT EXISTS students_created_at_idx ON public.students (created_at);

-- إضافة تعليقات للجدول
COMMENT ON TABLE public.students IS 'جدول بيانات الطلاب المسجلين';

-- إضافة تعليقات للأعمدة
COMMENT ON COLUMN public.students.full_name IS 'الاسم الرباعي';
COMMENT ON COLUMN public.students.national_id IS 'الرقم القومي';
COMMENT ON COLUMN public.students.passport_number IS 'رقم جواز السفر';
COMMENT ON COLUMN public.students.phone_number IS 'رقم الهاتف';
COMMENT ON COLUMN public.students.gender IS 'النوع';
COMMENT ON COLUMN public.students.age IS 'السن';
COMMENT ON COLUMN public.students.governorate IS 'المحافظة';
COMMENT ON COLUMN public.students.residence_address IS 'محل الإقامة';
COMMENT ON COLUMN public.students.educational_qualification IS 'المؤهل الدراسي';
COMMENT ON COLUMN public.students.education_type IS 'نوع التعليم';
COMMENT ON COLUMN public.students.occupation IS 'الوظيفة';
COMMENT ON COLUMN public.students.work_place IS 'جهة العمل';
COMMENT ON COLUMN public.students.college IS 'الكلية';
COMMENT ON COLUMN public.students.academic_year IS 'السنة الدراسية';
COMMENT ON COLUMN public.students.level IS 'المرحلة';
COMMENT ON COLUMN public.students.specialized_department IS 'قسم المرحلة التخصصية';
COMMENT ON COLUMN public.students.doctrine IS 'المذهب';
COMMENT ON COLUMN public.students.attendance_system IS 'نوع الدراسة';
COMMENT ON COLUMN public.students.special_needs IS 'من ذوي الهمم';
COMMENT ON COLUMN public.students.payment_reference_number IS 'الرقم المرجعي لايصال الدفع';
COMMENT ON COLUMN public.students.id_card_image IS 'رابط صورة البطاقة';
COMMENT ON COLUMN public.students.qualification_image IS 'رابط صورة المؤهل';
COMMENT ON COLUMN public.students.payment_receipt_image IS 'رابط صورة ايصال الدفع';
COMMENT ON COLUMN public.students.created_at IS 'تاريخ التسجيل';

-- إنشاء سياسات الوصول للجدول
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بالقراءة العامة
CREATE POLICY "Allow public read" ON public.students
    FOR SELECT USING (true);

-- سياسة للسماح بالإضافة العامة
CREATE POLICY "Allow public insert" ON public.students
    FOR INSERT WITH CHECK (true);

-- سياسة للسماح بالتحديث العام
CREATE POLICY "Allow public update" ON public.students
    FOR UPDATE USING (true) WITH CHECK (true);

-- سياسة للسماح بالحذف العام
CREATE POLICY "Allow public delete" ON public.students
    FOR DELETE USING (true);
