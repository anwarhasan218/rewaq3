# نظام تسجيل دارسي العلوم الشرعية والعربية

نظام بسيط لتسجيل بيانات دارسي العلوم الشرعية والعربية، مع واجهة مستخدم سهلة الاستخدام ومعاينة للصور قبل الرفع.

## المميزات

- واجهة مستخدم سهلة الاستخدام باللغة العربية
- نموذج تسجيل شامل لجميع البيانات المطلوبة
- قائمة منسدلة لاختيار المحافظة من بين 27 محافظة مصرية
- معاينة الصور قبل الرفع (صورة البطاقة، المؤهل، إيصال الدفع)
- تحقق من صحة البيانات المدخلة
- تصميم متجاوب يعمل على جميع الأجهزة
- نوع الدراسة يحتوي على خيارين فقط: مباشر وعن بعد

## التقنيات المستخدمة

- HTML5
- CSS3
- JavaScript
- Bootstrap 5 RTL
- Font Awesome
- Google Fonts (Tajawal)

## كيفية الاستخدام

1. قم بتنزيل الملفات أو استنساخ المستودع
2. افتح ملف `index.html` في متصفح الويب
3. املأ النموذج بالبيانات المطلوبة
4. اضغط على زر "تسجيل البيانات"

## كيفية الربط بقاعدة بيانات

لربط النموذج بقاعدة بيانات، يمكنك تعديل ملف `script.js` واستبدال التعليقات في دالة `form.addEventListener('submit', ...)` بكود حقيقي للاتصال بالخادم.

### مثال باستخدام Supabase:

```javascript
// إضافة مكتبة Supabase
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// إعداد Supabase
const supabaseUrl = 'https://htgmfpqwmujznhzbpsoa.supabase.co';
const supabaseKey = 'your-supabase-key';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// في دالة معالجة النموذج
form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // التحقق من صحة النموذج...
    
    // إعداد البيانات
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // رفع الصور (يحتاج إلى تنفيذ منفصل)
    
    // إرسال البيانات إلى Supabase
    try {
        const { data: result, error } = await supabase
            .from('students')
            .insert([data])
            .select();
            
        if (error) throw error;
        
        // عرض رسالة النجاح
        successMessage.classList.remove('d-none');
        
        // إعادة تعيين النموذج
        form.reset();
    } catch (error) {
        // عرض رسالة الخطأ
        errorMessage.textContent = error.message || 'حدث خطأ أثناء تسجيل البيانات';
        errorMessage.classList.remove('d-none');
    } finally {
        // إعادة تعيين حالة الزر
        submitText.textContent = 'تسجيل البيانات';
        loadingSpinner.classList.add('d-none');
        submitButton.disabled = false;
    }
});
```

## كيفية النشر

يمكنك نشر هذا المشروع على أي استضافة ويب بسيطة، مثل:

1. **GitHub Pages**: مجاني وسهل الاستخدام
2. **Netlify**: يوفر استضافة مجانية مع إمكانيات متقدمة
3. **Vercel**: مناسب للمشاريع الأكثر تعقيدًا

### خطوات النشر على GitHub Pages:

1. قم برفع الملفات إلى مستودع GitHub
2. انتقل إلى إعدادات المستودع
3. انتقل إلى قسم "Pages"
4. اختر الفرع الرئيسي كمصدر
5. انقر على "Save"

## الترخيص

هذا المشروع متاح تحت رخصة MIT.
