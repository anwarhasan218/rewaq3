// هذا الملف لإنشاء مجلدات التخزين في Supabase
// قم بتنفيذه مرة واحدة فقط لإعداد التخزين

// استخدم نفس بيانات الاتصال من ملف supabase.js
const supabaseUrl = 'https://htgmfpqwmujznhzbpsoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Z21mcHF3bXVqem5oemJwc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA3OTksImV4cCI6MjA2MTA1Njc5OX0.3gqo0JGIdpJ2GlYYCIe1Ua8umMmcLs9l7G5-hcfKOSU';

// إنشاء عميل Supabase
let supabase;

async function setupStorage() {
    try {
        // التحقق من وجود مكتبة Supabase
        if (typeof supabaseClient === 'undefined') {
            if (typeof window !== 'undefined' && window.supabase) {
                supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            } else {
                // إذا كنت تستخدم Node.js
                const { createClient } = require('@supabase/supabase-js');
                supabase = createClient(supabaseUrl, supabaseKey);
            }
        } else {
            supabase = supabaseClient;
        }

        console.log('بدء إنشاء مجلدات التخزين...');

        // 1. إنشاء المجلد الرئيسي (Bucket)
        const { data: bucketData, error: bucketError } = await supabase
            .storage
            .createBucket('student-documents', {
                public: true, // جعل المجلد عامًا للوصول
                fileSizeLimit: 5242880 // 5 ميجابايت كحد أقصى لحجم الملف
            });

        if (bucketError) {
            // إذا كان المجلد موجودًا بالفعل، تجاهل الخطأ
            if (bucketError.message.includes('already exists')) {
                console.log('المجلد student-documents موجود بالفعل');
            } else {
                throw bucketError;
            }
        } else {
            console.log('تم إنشاء المجلد student-documents بنجاح');
        }

        // 2. إنشاء سياسات للمجلد
        const { error: policyError } = await supabase
            .storage
            .from('student-documents')
            .createPolicy('allow-public-read', {
                name: 'allow-public-read',
                definition: {
                    statements: [
                        {
                            effect: 'allow',
                            principal: '*',
                            actions: ['select'],
                            resources: ['*']
                        }
                    ]
                }
            });

        if (policyError) {
            console.error('خطأ في إنشاء سياسة القراءة:', policyError);
        } else {
            console.log('تم إنشاء سياسة القراءة بنجاح');
        }

        const { error: policyError2 } = await supabase
            .storage
            .from('student-documents')
            .createPolicy('allow-public-insert', {
                name: 'allow-public-insert',
                definition: {
                    statements: [
                        {
                            effect: 'allow',
                            principal: '*',
                            actions: ['insert'],
                            resources: ['*']
                        }
                    ]
                }
            });

        if (policyError2) {
            console.error('خطأ في إنشاء سياسة الإضافة:', policyError2);
        } else {
            console.log('تم إنشاء سياسة الإضافة بنجاح');
        }

        // 3. إنشاء المجلدات الفرعية عن طريق رفع ملف وهمي ثم حذفه
        // مجلد بطاقات الهوية
        const { error: idCardError } = await supabase
            .storage
            .from('student-documents')
            .upload('id-cards/.placeholder', new Blob(['placeholder']), {
                contentType: 'text/plain'
            });

        if (idCardError && !idCardError.message.includes('already exists')) {
            console.error('خطأ في إنشاء مجلد id-cards:', idCardError);
        } else {
            console.log('تم إنشاء مجلد id-cards بنجاح');
        }

        // مجلد المؤهلات
        const { error: qualificationsError } = await supabase
            .storage
            .from('student-documents')
            .upload('qualifications/.placeholder', new Blob(['placeholder']), {
                contentType: 'text/plain'
            });

        if (qualificationsError && !qualificationsError.message.includes('already exists')) {
            console.error('خطأ في إنشاء مجلد qualifications:', qualificationsError);
        } else {
            console.log('تم إنشاء مجلد qualifications بنجاح');
        }

        // مجلد إيصالات الدفع
        const { error: paymentsError } = await supabase
            .storage
            .from('student-documents')
            .upload('payment-receipts/.placeholder', new Blob(['placeholder']), {
                contentType: 'text/plain'
            });

        if (paymentsError && !paymentsError.message.includes('already exists')) {
            console.error('خطأ في إنشاء مجلد payment-receipts:', paymentsError);
        } else {
            console.log('تم إنشاء مجلد payment-receipts بنجاح');
        }

        console.log('تم إنشاء جميع مجلدات التخزين بنجاح!');
    } catch (error) {
        console.error('حدث خطأ أثناء إعداد التخزين:', error);
    }
}

// تنفيذ الدالة
if (typeof window !== 'undefined') {
    // في المتصفح
    document.addEventListener('DOMContentLoaded', setupStorage);
} else {
    // في Node.js
    setupStorage();
}
