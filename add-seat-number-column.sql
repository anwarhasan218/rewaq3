-- إضافة عمود رقم الجلوس إلى جدول الطلاب
ALTER TABLE students ADD COLUMN seat_number VARCHAR(50);

-- إضافة تعليق وصفي للعمود
COMMENT ON COLUMN students.seat_number IS 'رقم الجلوس للطالب';
