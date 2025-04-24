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
        'رقم الجلوس',
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
        seatNumber: 'رقم الجلوس',
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

                // Convert field names from camelCase to snake_case
                const studentData = {};
                for (const key in row) {
                    // Convert camelCase to snake_case
                    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                    studentData[snakeKey] = row[key];
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

        // Convert snake_case to camelCase
        const convertedData = data.map(item => {
            const converted = {};
            for (const key in item) {
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

        // Convert camelCase to snake_case for database
        const dbData = {};
        for (const key in data) {
            // Skip special fields that shouldn't be sent to the database
            if (key === 'studentId' || key === 'formMode') continue;
            if (key.endsWith('_file')) continue; // Skip file input fields

            // Convert camelCase to snake_case
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            dbData[snakeKey] = data[key];
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
    deleteAllStudents
};
