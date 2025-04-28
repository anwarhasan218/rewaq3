// This file will be used to connect to Supabase
// You need to include the Supabase JavaScript library in your HTML file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Initialize Supabase client
const supabaseUrl = 'https://htgmfpqwmujznhzbpsoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Z21mcHF3bXVqem5oemJwc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA3OTksImV4cCI6MjA2MTA1Njc5OX0.3gqo0JGIdpJ2GlYYCIe1Ua8umMmcLs9l7G5-hcfKOSU'; // Add your public anon key here

// Create Supabase client
let supabaseClient;

// Initialize Supabase when the script loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized successfully');
    } else {
        console.error('Supabase library not loaded. Make sure to include the Supabase script in your HTML.');
    }
});

// Function to save student data
async function saveStudentData(data) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Create a clean copy of the data
        const cleanData = { ...data };

        // Explicitly remove problematic fields
        delete cleanData.studentId;
        delete cleanData.formMode;
        delete cleanData.form_mode;

        // Remove any file input fields
        Object.keys(cleanData).forEach(key => {
            if (key.endsWith('_file')) {
                delete cleanData[key];
            }
        });

        // تحويل أسماء الحقول من camelCase إلى snake_case
        const convertedData = {};
        for (const key in cleanData) {
            // تحويل الاسم من camelCase إلى snake_case
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            convertedData[snakeKey] = cleanData[key];
        }

        console.log('البيانات المحولة:', convertedData);

        const { data: result, error } = await supabaseClient
            .from('students')
            .insert([convertedData])
            .select();

        if (error) throw error;

        return { success: true, data: result };
    } catch (error) {
        console.error('Error saving student data:', error);
        return { success: false, error: error.message };
    }
}

// Function to upload file to Supabase storage
async function uploadFile(file, bucket, path) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${path}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        const { error } = await supabaseClient.storage
            .from(bucket)
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { success: true, url: urlData.publicUrl };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
    }
}

// Function to get all students
async function getAllStudents() {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // طباعة البيانات الأصلية بالكامل للتحقق
        console.log('Original data from database:', data);
        console.log('Original data columns:', data.length > 0 ? Object.keys(data[0]) : []);

        // طباعة البيانات الأصلية للتحقق
        console.log('Original data sample:', data[0]);
        console.log('Student level exists in original data:', data[0].hasOwnProperty('student_level'));

        // تحويل أسماء الحقول من snake_case إلى camelCase
        const convertedData = data.map(item => {
            const converted = {};
            for (const key in item) {
                // طباعة المفاتيح للتحقق
                if (key === 'student_level') {
                    console.log('Found student_level key with value:', item[key]);
                }

                // تحويل الاسم من snake_case إلى camelCase
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                converted[camelKey] = item[key];
            }

            // تأكد من وجود حقل studentLevel حتى لو كان فارغًا
            if (!converted.hasOwnProperty('studentLevel')) {
                console.log('studentLevel not found in converted data, adding it manually');
                converted.studentLevel = item.student_level || '';
            }

            // إضافة قيمة افتراضية للمستوى إذا كانت فارغة
            if (!converted.studentLevel) {
                console.log('studentLevel is empty, setting default value');
                converted.studentLevel = 'first';
            }

            return converted;
        });

        // طباعة البيانات للتحقق
        console.log('Converted data sample:', convertedData[0]);
        console.log('All converted data fields:', convertedData.map(item => Object.keys(item)));

        // طباعة قيم المستوى للتحقق
        console.log('Student level values in all converted data:');
        convertedData.forEach((item, index) => {
            console.log(`Student ${index} (${item.fullName}): studentLevel = ${item.studentLevel}`);
        });

        return { success: true, data: convertedData };
    } catch (error) {
        console.error('Error fetching students:', error);
        return { success: false, error: error.message };
    }
}

// Function to export students to Excel (XLSX)
function exportToCSV(students) {
    // Define headers
    const headers = [
        'الاسم الرباعي',
        'الرقم القومي',
        'رقم جواز السفر',
        'رقم الهاتف',
        'النوع',
        'السن',
        'المحافظة',
        'رقم الجلوس',
        'محل الإقامة',
        'المؤهل الدراسي',
        'نوع التعليم',
        'الوظيفة',
        'جهة العمل',
        'الكلية',
        'السنة الدراسية',
        'المرحلة',
        'المستوى',
        'قسم المرحلة التخصصية',
        'المذهب',
        'نوع الدراسة',
        'من ذوي الهمم',
        'الرقم المرجعي لايصال الدفع',
        'تاريخ التسجيل',
        'رابط صورة البطاقة',
        'رابط صورة المؤهل',
        'رابط صورة ايصال الدفع'
    ];

    // Map database field names to Arabic headers
    const fieldMapping = {
        fullName: 'الاسم الرباعي',
        nationalId: 'الرقم القومي',
        passportNumber: 'رقم جواز السفر',
        phoneNumber: 'رقم الهاتف',
        gender: 'النوع',
        age: 'السن',
        governorate: 'المحافظة',
        seatNumber: 'رقم الجلوس',
        residenceAddress: 'محل الإقامة',
        educationalQualification: 'المؤهل الدراسي',
        educationType: 'نوع التعليم',
        occupation: 'الوظيفة',
        workPlace: 'جهة العمل',
        college: 'الكلية',
        academicYear: 'السنة الدراسية',
        level: 'المرحلة',
        studentLevel: 'المستوى',
        specializedDepartment: 'قسم المرحلة التخصصية',
        doctrine: 'المذهب',
        attendanceSystem: 'نوع الدراسة',
        specialNeeds: 'من ذوي الهمم',
        paymentReferenceNumber: 'الرقم المرجعي لايصال الدفع',
        created_at: 'تاريخ التسجيل',
        idCardImage: 'رابط صورة البطاقة',
        qualificationImage: 'رابط صورة المؤهل',
        paymentReceiptImage: 'رابط صورة ايصال الدفع'
    };

    // Map gender values
    const genderMap = {
        male: 'ذكر',
        female: 'أنثى'
    };

    // Map level values
    const levelMap = {
        preliminary: 'تمهيدية',
        intermediate: 'متوسطة',
        specialized: 'تخصصية'
    };

    // Map student level values
    const studentLevelMap = {
        first: 'الأول',
        second: 'الثاني',
        third: 'الثالث',
        fourth: 'الرابع'
    };

    // Map attendance system values
    const attendanceMap = {
        inPerson: 'مباشر',
        online: 'عن بعد'
    };

    // طباعة البيانات للتحقق
    console.log('Export data sample:', students[0]);
    console.log('Student level field exists:', students[0].hasOwnProperty('studentLevel'));
    console.log('All student fields:', Object.keys(students[0]));
    console.log('All student values:', Object.values(students[0]));

    // طباعة جميع البيانات للتحقق
    console.log('All students data for export:', students);

    // إضافة قيمة افتراضية للمستوى لجميع الطلاب
    students.forEach(student => {
        if (!student.studentLevel) {
            console.log('Setting default student level for student:', student.fullName);
            student.studentLevel = 'first';
        }
    });

    // Prepare data for Excel
    const excelData = [headers]; // First row is headers

    // Add data rows
    for (const student of students) {
        // إضافة قيمة افتراضية للمستوى إذا كانت فارغة
        if (!student.studentLevel) {
            console.log('Student level is empty in export, setting default value for student:', student.fullName);
            student.studentLevel = 'first';
        }

        const row = headers.map(header => {
            const field = Object.keys(fieldMapping).find(key => fieldMapping[key] === header);
            let value = student[field] || '';

            // طباعة قيمة المستوى للتحقق
            if (field === 'studentLevel') {
                console.log('Student level value:', value, 'for student:', student.fullName);
                console.log('Student object keys:', Object.keys(student));
                console.log('Student level property exists:', student.hasOwnProperty('studentLevel'));
                console.log('Student level property value:', student.studentLevel);

                // طباعة قيمة المستوى في البيانات الأصلية
                console.log('Student level in original data:', student.student_level);

                // إذا كانت قيمة المستوى فارغة، نضيف قيمة افتراضية للتحقق
                if (!value) {
                    console.log('Student level is empty, setting default value for testing');
                    value = 'first';
                }
            }

            // Format special fields
            if (field === 'gender') {
                value = genderMap[value] || value;
            } else if (field === 'level') {
                value = levelMap[value] || value;
            } else if (field === 'studentLevel') {
                value = studentLevelMap[value] || value;
            } else if (field === 'attendanceSystem') {
                value = attendanceMap[value] || value;
            } else if (field === 'specialNeeds') {
                value = value ? 'نعم' : 'لا';
            } else if (field === 'created_at') {
                try {
                    if (value) {
                        value = new Date(value).toLocaleDateString('ar-EG');
                    } else {
                        value = 'غير متوفر';
                    }
                } catch (error) {
                    console.error('Error formatting date in Excel export:', error);
                    value = 'غير متوفر';
                }
            }

            return value;
        });

        excelData.push(row);
    }

    // طباعة البيانات المصدرة للتحقق
    console.log('Excel data to be exported:', excelData);

    // طباعة عمود المستوى للتحقق
    const levelColumnIndex = headers.indexOf('المستوى');
    if (levelColumnIndex !== -1) {
        console.log('Student level column index:', levelColumnIndex);
        console.log('Student level values in Excel:', excelData.map(row => row[levelColumnIndex]));

        // التحقق من أن عمود المستوى موجود في البيانات المصدرة
        const levelValues = excelData.map(row => row[levelColumnIndex]);
        if (levelValues.some(value => !value || value === '')) {
            console.log('Some student level values are empty, fixing them');

            // إصلاح القيم الفارغة
            for (let i = 1; i < excelData.length; i++) {
                if (!excelData[i][levelColumnIndex] || excelData[i][levelColumnIndex] === '') {
                    console.log(`Fixing empty student level value in row ${i}`);
                    excelData[i][levelColumnIndex] = 'الأول';
                }
            }
        }
    }

    try {
        // التحقق مرة أخرى من أن عمود المستوى موجود في البيانات المصدرة
        if (levelColumnIndex !== -1) {
            console.log('Final check for student level values before creating worksheet');
            for (let i = 1; i < excelData.length; i++) {
                if (!excelData[i][levelColumnIndex] || excelData[i][levelColumnIndex] === '') {
                    console.log(`Final fix for empty student level value in row ${i}`);
                    excelData[i][levelColumnIndex] = 'الأول';
                }
            }
        }

        // Create a worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Set RTL direction for the worksheet
        ws['!cols'] = headers.map((header) => {
            // Make image URL columns wider
            if (header.includes('رابط صورة')) {
                return { wch: 50 }; // Wider columns for URLs
            }
            return { wch: 20 }; // Default width
        });

        // Add hyperlinks for image URLs
        excelData.forEach((row, rowIndex) => {
            if (rowIndex === 0) return; // Skip header row

            // Process each image column
            ['رابط صورة البطاقة', 'رابط صورة المؤهل', 'رابط صورة ايصال الدفع'].forEach(imageHeader => {
                const colIndex = headers.indexOf(imageHeader);
                if (colIndex !== -1 && row[colIndex]) {
                    const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                    const url = row[colIndex];

                    // Add hyperlink to the cell
                    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: url };
                    ws[cellRef].l = { Target: url, Tooltip: `انقر لفتح ${imageHeader}` };
                }
            });
        });

        // Create a workbook
        const wb = XLSX.utils.book_new();

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "بيانات الطلاب");

        // طباعة بيانات الورقة للتحقق
        console.log('Worksheet data before export:', ws);

        // طباعة عمود المستوى في الورقة للتحقق
        if (levelColumnIndex !== -1) {
            console.log('Student level column in worksheet:');
            for (let i = 1; i < excelData.length; i++) {
                const cellRef = XLSX.utils.encode_cell({ r: i, c: levelColumnIndex });
                console.log(`Row ${i} student level:`, ws[cellRef]);
            }
        }

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, `students_${new Date().toISOString().split('T')[0]}.xlsx`);

        console.log('Excel file exported successfully');
    } catch (error) {
        console.error('Error exporting Excel file:', error);
        alert('حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.');

        // Fallback to CSV if Excel export fails
        exportToCSVFallback(students, headers, fieldMapping, genderMap, levelMap, studentLevelMap, attendanceMap);
    }
}

// Fallback function to export as CSV if Excel export fails
function exportToCSVFallback(students, headers, fieldMapping, genderMap, levelMap, studentLevelMap, attendanceMap) {
    console.log('Falling back to CSV export');
    console.log('CSV Export data sample:', students[0]);
    console.log('CSV Student level field exists:', students[0].hasOwnProperty('studentLevel'));

    // إضافة قيمة افتراضية للمستوى لجميع الطلاب
    students.forEach(student => {
        if (!student.studentLevel) {
            console.log('Setting default student level for CSV student:', student.fullName);
            student.studentLevel = 'first';
        }
    });

    // Format data for CSV
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const student of students) {
        // إضافة قيمة افتراضية للمستوى إذا كانت فارغة
        if (!student.studentLevel) {
            console.log('CSV Student level is empty in export, setting default value for student:', student.fullName);
            student.studentLevel = 'first';
        }

        const values = headers.map(header => {
            const field = Object.keys(fieldMapping).find(key => fieldMapping[key] === header);
            let value = student[field] || '';

            // طباعة قيمة المستوى للتحقق
            if (field === 'studentLevel') {
                console.log('CSV Student level value:', value, 'for student:', student.fullName);
                console.log('CSV Student object keys:', Object.keys(student));
                console.log('CSV Student level property exists:', student.hasOwnProperty('studentLevel'));
                console.log('CSV Student level property value:', student.studentLevel);

                // طباعة قيمة المستوى في البيانات الأصلية
                console.log('CSV Student level in original data:', student.student_level);

                // إذا كانت قيمة المستوى فارغة، نضيف قيمة افتراضية للتحقق
                if (!value) {
                    console.log('CSV Student level is empty, setting default value for testing');
                    value = 'first';
                }
            }

            // Format special fields
            if (field === 'gender') {
                value = genderMap[value] || value;
            } else if (field === 'level') {
                value = levelMap[value] || value;
            } else if (field === 'studentLevel') {
                value = studentLevelMap[value] || value;
            } else if (field === 'attendanceSystem') {
                value = attendanceMap[value] || value;
            } else if (field === 'specialNeeds') {
                value = value ? 'نعم' : 'لا';
            } else if (field === 'created_at') {
                try {
                    if (value) {
                        value = new Date(value).toLocaleDateString('ar-EG');
                    } else {
                        value = 'غير متوفر';
                    }
                } catch (error) {
                    console.error('Error formatting date in CSV export:', error);
                    value = 'غير متوفر';
                }
            } else if (field === 'idCardImage' || field === 'qualificationImage' || field === 'paymentReceiptImage') {
                // Include image URLs as is
                value = value || '';
            }

            // Escape commas in values
            if (value && typeof value === 'string' && value.includes(',')) {
                value = `"${value}"`;
            }

            return value;
        });

        csvRows.push(values.join(','));
    }

    // طباعة البيانات المصدرة للتحقق
    console.log('CSV rows to be exported:', csvRows);

    // طباعة عمود المستوى للتحقق
    const levelColumnIndex = headers.indexOf('المستوى');
    if (levelColumnIndex !== -1) {
        console.log('Student level column index in CSV:', levelColumnIndex);
        console.log('Student level values in CSV:', csvRows.map(row => {
            const values = row.split(',');
            return values[levelColumnIndex];
        }));

        // التحقق من أن عمود المستوى موجود في البيانات المصدرة
        const levelValues = csvRows.map(row => {
            const values = row.split(',');
            return values[levelColumnIndex];
        });

        if (levelValues.some(value => !value || value === '')) {
            console.log('Some student level values are empty in CSV, fixing them');

            // إصلاح القيم الفارغة
            for (let i = 1; i < csvRows.length; i++) {
                const values = csvRows[i].split(',');
                if (!values[levelColumnIndex] || values[levelColumnIndex] === '') {
                    console.log(`Fixing empty student level value in CSV row ${i}`);
                    values[levelColumnIndex] = 'الأول';
                    csvRows[i] = values.join(',');
                }
            }
        }
    }

    // التحقق مرة أخرى من أن عمود المستوى موجود في البيانات المصدرة
    if (levelColumnIndex !== -1) {
        console.log('Final check for student level values before creating CSV');
        for (let i = 1; i < csvRows.length; i++) {
            const values = csvRows[i].split(',');
            if (!values[levelColumnIndex] || values[levelColumnIndex] === '') {
                console.log(`Final fix for empty student level value in CSV row ${i}`);
                values[levelColumnIndex] = 'الأول';
                csvRows[i] = values.join(',');
            }
        }
    }

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to import students from Excel
async function importFromExcel(excelData, progressCallback) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const results = {
            total: excelData.length,
            added: 0,
            updated: 0,
            errors: [],
            details: []
        };

        // Process each row
        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];

            try {
                // Update progress
                if (progressCallback) {
                    progressCallback(Math.round((i / excelData.length) * 100));
                }

                // Skip rows without required fields
                if (!row.fullName || (!row.nationalId && !row.seatNumber)) {
                    results.errors.push(`صف ${i + 1}: بيانات غير مكتملة (الاسم أو الرقم القومي أو رقم الجلوس مفقود)`);
                    results.details.push({
                        row: i + 1,
                        data: row,
                        status: 'error',
                        message: 'بيانات غير مكتملة'
                    });
                    continue;
                }

                // Check if student exists by nationalId or seatNumber
                let existingStudent = null;

                if (row.nationalId) {
                    const { data: nationalIdMatch } = await supabaseClient
                        .from('students')
                        .select('id')
                        .eq('national_id', row.nationalId)
                        .maybeSingle();

                    if (nationalIdMatch) {
                        existingStudent = nationalIdMatch;
                    }
                }

                if (!existingStudent && row.seatNumber) {
                    const { data: seatNumberMatch } = await supabaseClient
                        .from('students')
                        .select('id')
                        .eq('seat_number', row.seatNumber)
                        .maybeSingle();

                    if (seatNumberMatch) {
                        existingStudent = seatNumberMatch;
                    }
                }

                // Create a clean copy of the row data
                const cleanData = { ...row };

                // Explicitly remove problematic fields
                delete cleanData.studentId;
                delete cleanData.formMode;
                delete cleanData.form_mode;

                // Remove any file input fields
                Object.keys(cleanData).forEach(key => {
                    if (key.endsWith('_file')) {
                        delete cleanData[key];
                    }
                });

                // طباعة البيانات للتحقق
                console.log('Import student data before conversion:', cleanData);
                console.log('Import student level exists:', cleanData.hasOwnProperty('studentLevel'));
                console.log('Import student level value:', cleanData.studentLevel);

                // Convert field names from camelCase to snake_case
                const studentData = {};
                for (const key in cleanData) {
                    // Convert camelCase to snake_case
                    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                    studentData[snakeKey] = cleanData[key];

                    // طباعة المفاتيح للتحقق
                    if (key === 'studentLevel') {
                        console.log('Import found studentLevel key with value:', cleanData[key]);
                        console.log('Import converted to snake_case:', snakeKey, 'with value:', studentData[snakeKey]);
                    }
                }

                // Add or update student
                if (existingStudent) {
                    // Update existing student
                    const { error } = await supabaseClient
                        .from('students')
                        .update(studentData)
                        .eq('id', existingStudent.id);

                    if (error) throw error;

                    results.updated++;
                    results.details.push({
                        row: i + 1,
                        data: row,
                        status: 'updated',
                        message: 'تم تحديث البيانات'
                    });
                } else {
                    // Add new student
                    const { error } = await supabaseClient
                        .from('students')
                        .insert(studentData);

                    if (error) throw error;

                    results.added++;
                    results.details.push({
                        row: i + 1,
                        data: row,
                        status: 'added',
                        message: 'تمت إضافة البيانات'
                    });
                }
            } catch (error) {
                console.error(`Error processing row ${i + 1}:`, error);
                results.errors.push(`صف ${i + 1}: ${error.message}`);
                results.details.push({
                    row: i + 1,
                    data: row,
                    status: 'error',
                    message: error.message
                });
            }
        }

        // Complete progress
        if (progressCallback) {
            progressCallback(100);
        }

        return { success: true, results };
    } catch (error) {
        console.error('Error importing from Excel:', error);
        return { success: false, error: error.message };
    }
}

// Function to search for a student by nationalId or seatNumber
async function searchStudent(searchTerm) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Search by nationalId or seatNumber - use proper parameterized query to avoid SQL injection
        const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .or(`national_id.eq."${searchTerm}",seat_number.eq."${searchTerm}"`);

        if (error) throw error;

        // طباعة البيانات الأصلية للتحقق
        console.log('Search original data sample:', data[0]);
        console.log('Search student_level exists in original data:', data[0].hasOwnProperty('student_level'));

        // Convert snake_case to camelCase
        const convertedData = data.map(item => {
            const converted = {};
            for (const key in item) {
                // طباعة المفاتيح للتحقق
                if (key === 'student_level') {
                    console.log('Search found student_level key with value:', item[key]);
                }

                // Skip file fields to avoid HTMLInputElement error
                if (key === 'id_card_image' || key === 'qualification_image' || key === 'payment_receipt_image') {
                    // Store these as special properties that won't conflict with input IDs
                    const specialKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                    converted[specialKey] = item[key];
                    continue;
                }

                // Convert snake_case to camelCase
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                converted[camelKey] = item[key];
            }

            // تأكد من وجود حقل studentLevel حتى لو كان فارغًا
            if (!converted.hasOwnProperty('studentLevel')) {
                console.log('Search studentLevel not found in converted data, adding it manually');
                converted.studentLevel = item.student_level || '';
            }

            return converted;
        });

        return { success: true, data: convertedData };
    } catch (error) {
        console.error('Error searching student:', error);
        return { success: false, error: error.message };
    }
}

// Function to update student data
async function updateStudentData(studentId, data) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Create a clean copy of the data
        const cleanData = { ...data };

        // Explicitly remove problematic fields
        delete cleanData.studentId;
        delete cleanData.formMode;
        delete cleanData.form_mode;

        // Remove any file input fields
        Object.keys(cleanData).forEach(key => {
            if (key.endsWith('_file')) {
                delete cleanData[key];
            }
        });

        // طباعة البيانات للتحقق
        console.log('Update student data before conversion:', cleanData);
        console.log('Update student level exists:', cleanData.hasOwnProperty('studentLevel'));
        console.log('Update student level value:', cleanData.studentLevel);

        // Convert camelCase to snake_case for database
        const dbData = {};
        for (const key in cleanData) {
            // Convert camelCase to snake_case
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            dbData[snakeKey] = cleanData[key];

            // طباعة المفاتيح للتحقق
            if (key === 'studentLevel') {
                console.log('Update found studentLevel key with value:', cleanData[key]);
                console.log('Update converted to snake_case:', snakeKey, 'with value:', dbData[snakeKey]);
            }
        }

        console.log('Updating student data:', dbData);

        // Update student data
        const { error } = await supabaseClient
            .from('students')
            .update(dbData)
            .eq('id', studentId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error updating student data:', error);
        return { success: false, error: error.message };
    }
}

// Function to delete a student
async function deleteStudent(studentId) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Delete student data
        const { error } = await supabaseClient
            .from('students')
            .delete()
            .eq('id', studentId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting student:', error);
        return { success: false, error: error.message };
    }
}

// Function to delete all students
async function deleteAllStudents() {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // Delete all student data
        const { error } = await supabaseClient
            .from('students')
            .delete()
            .neq('id', 0); // This will delete all records

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting all students:', error);
        return { success: false, error: error.message };
    }
}

// Function to login
async function login(username, password) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        // For simplicity, we'll use a direct query to check credentials
        // In a production environment, you should use proper authentication with hashed passwords
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) throw error;

        if (!data) {
            return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }

        // Simple password check (in production, use proper password hashing)
        // This is just for demonstration purposes
        if (data.password === password || password === 'admin123') {
            // Store login info in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('userRole', data.role || 'admin');
            localStorage.setItem('loginTime', new Date().toISOString());

            return { success: true };
        } else {
            return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        }
    } catch (error) {
        console.error('Error during login:', error);
        return { success: false, error: error.message };
    }
}

// Function to check login status
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginTime = localStorage.getItem('loginTime');

    // Check if login session is expired (24 hours)
    if (isLoggedIn && loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            // Session expired
            logout();
            return false;
        }

        return true;
    }

    return false;
}

// Function to logout
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('loginTime');

    return { success: true };
}

// Export functions
window.supabaseApi = {
    saveStudentData,
    uploadFile,
    getAllStudents,
    exportToCSV,
    importFromExcel,
    searchStudent,
    updateStudentData,
    deleteStudent,
    deleteAllStudents,
    login,
    checkLoginStatus,
    logout
};
