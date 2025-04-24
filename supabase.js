// This file will be used to connect to Supabase
// You need to include the Supabase JavaScript library in your HTML file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Initialize Supabase client
const supabaseUrl = 'https://htgmfpqwmujznhzbpsoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Z21mcHF3bXVqem5oemJwc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA3OTksImV4cCI6MjA2MTA1Njc5OX0.3gqo0JGIdpJ2GlYYCIe1Ua8umMmcLs9l7G5-hcfKOSU'; // Add your public anon key here
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Function to save student data
async function saveStudentData(data) {
    try {
        const { data: result, error } = await supabase
            .from('students')
            .insert([data])
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
        const fileExt = file.name.split('.').pop();
        const fileName = `${path}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${path}/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);
            
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
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
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching students:', error);
        return { success: false, error: error.message };
    }
}

// Function to export students to CSV
function exportToCSV(students) {
    // Define CSV headers
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
        'تاريخ التسجيل'
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
        created_at: 'تاريخ التسجيل'
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
                value = new Date(value).toLocaleDateString('ar-EG');
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
window.supabaseClient = {
    saveStudentData,
    uploadFile,
    getAllStudents,
    exportToCSV
};
