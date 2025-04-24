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

        // تحويل أسماء الحقول من camelCase إلى snake_case
        const convertedData = {};
        for (const key in data) {
            // تحويل الاسم من camelCase إلى snake_case
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            convertedData[snakeKey] = data[key];
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

        // تحويل أسماء الحقول من snake_case إلى camelCase
        const convertedData = data.map(item => {
            const converted = {};
            for (const key in item) {
                // تحويل الاسم من snake_case إلى camelCase
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                converted[camelKey] = item[key];
            }
            return converted;
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
        'محل الإقامة',
        'المؤهل الدراسي',
        'نوع التعليم',
        'الوظيفة',
        'جهة العمل',
        'الكلية',
        'السنة الدراسية',
        'المرحلة',
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
        residenceAddress: 'محل الإقامة',
        educationalQualification: 'المؤهل الدراسي',
        educationType: 'نوع التعليم',
        occupation: 'الوظيفة',
        workPlace: 'جهة العمل',
        college: 'الكلية',
        academicYear: 'السنة الدراسية',
        level: 'المرحلة',
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

    // Map attendance system values
    const attendanceMap = {
        inPerson: 'مباشر',
        online: 'عن بعد'
    };

    // Prepare data for Excel
    const excelData = [headers]; // First row is headers

    // Add data rows
    for (const student of students) {
        const row = headers.map(header => {
            const field = Object.keys(fieldMapping).find(key => fieldMapping[key] === header);
            let value = student[field] || '';

            // Format special fields
            if (field === 'gender') {
                value = genderMap[value] || value;
            } else if (field === 'level') {
                value = levelMap[value] || value;
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

    try {
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

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, `students_${new Date().toISOString().split('T')[0]}.xlsx`);

        console.log('Excel file exported successfully');
    } catch (error) {
        console.error('Error exporting Excel file:', error);
        alert('حدث خطأ أثناء تصدير الملف. يرجى المحاولة مرة أخرى.');

        // Fallback to CSV if Excel export fails
        exportToCSVFallback(students, headers, fieldMapping, genderMap, levelMap, attendanceMap);
    }
}

// Fallback function to export as CSV if Excel export fails
function exportToCSVFallback(students, headers, fieldMapping, genderMap, levelMap, attendanceMap) {
    console.log('Falling back to CSV export');

    // Format data for CSV
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const student of students) {
        const values = headers.map(header => {
            const field = Object.keys(fieldMapping).find(key => fieldMapping[key] === header);
            let value = student[field] || '';

            // Format special fields
            if (field === 'gender') {
                value = genderMap[value] || value;
            } else if (field === 'level') {
                value = levelMap[value] || value;
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

// Export functions
window.supabaseApi = {
    saveStudentData,
    uploadFile,
    getAllStudents,
    exportToCSV
};
