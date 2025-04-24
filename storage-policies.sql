-- هذا الملف يحتوي على أوامر SQL لإنشاء سياسات التخزين في Supabase
-- ملاحظة: يجب إنشاء المجلد (bucket) أولاً من خلال واجهة المستخدم أو JavaScript API

-- إنشاء سياسة للسماح بالقراءة العامة
CREATE POLICY "Allow public read" 
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'student-documents');

-- إنشاء سياسة للسماح بالإضافة العامة
CREATE POLICY "Allow public insert" 
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'student-documents');

-- إنشاء سياسة للسماح بالتحديث العام
CREATE POLICY "Allow public update" 
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'student-documents')
WITH CHECK (bucket_id = 'student-documents');

-- إنشاء سياسة للسماح بالحذف العام
CREATE POLICY "Allow public delete" 
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'student-documents');
