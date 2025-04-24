// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const totalStudentsEl = document.getElementById('totalStudents');
    const maleCountEl = document.getElementById('maleCount');
    const femaleCountEl = document.getElementById('femaleCount');
    const todayCountEl = document.getElementById('todayCount');
    const studentsTableBody = document.getElementById('studentsTableBody');
    const filterGovernorate = document.getElementById('filterGovernorate');
    const filterLevel = document.getElementById('filterLevel');
    const filterGender = document.getElementById('filterGender');
    const filterAttendance = document.getElementById('filterAttendance');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const exportAllBtn = document.getElementById('exportAllBtn');
    const exportFilteredBtn = document.getElementById('exportFilteredBtn');
    const importExcelBtn = document.getElementById('importExcelBtn');
    const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    const excelFileInput = document.getElementById('excelFileInput');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    const importProgress = document.getElementById('importProgress');
    const importResults = document.getElementById('importResults');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const pagination = document.getElementById('pagination');

    // Variables
    let allStudents = [];
    let filteredStudents = [];
    let currentPage = 1;
    const studentsPerPage = 10;

    // Initialize
    loadStudents();

    // Event Listeners
    applyFilterBtn.addEventListener('click', applyFilters);
    resetFilterBtn.addEventListener('click', resetFilters);
    exportAllBtn.addEventListener('click', () => window.supabaseApi.exportToCSV(allStudents));
    exportFilteredBtn.addEventListener('click', () => window.supabaseApi.exportToCSV(filteredStudents));
    downloadTemplateBtn.addEventListener('click', createExcelTemplate);
    importExcelBtn.addEventListener('click', () => {
        // Reset import UI
        importResults.innerHTML = '';
        importProgress.classList.add('d-none');
        importProgress.querySelector('.progress-bar').style.width = '0%';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('importExcelModal'));
        modal.show();

        // Trigger file input when user clicks the import button
        excelFileInput.click();
    });

    excelFileInput.addEventListener('change', handleExcelFile);
    confirmImportBtn.addEventListener('click', processExcelImport);

    searchBtn.addEventListener('click', searchStudents);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchStudents();
        }
    });

    // Functions
    async function loadStudents() {
        try {
            // Show loading state
            studentsTableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4">جاري تحميل البيانات...</td></tr>';

            // Get students from Supabase
            const result = await window.supabaseApi.getAllStudents();

            if (!result.success) {
                throw new Error(result.error);
            }

            allStudents = result.data;
            filteredStudents = [...allStudents];

            // Update statistics
            updateStatistics(allStudents);

            // Populate governorate filter
            populateGovernorateFilter(allStudents);

            // Display students
            displayStudents(filteredStudents, currentPage);

            // Enable export filtered button
            exportFilteredBtn.disabled = false;
        } catch (error) {
            console.error('Error loading students:', error);
            studentsTableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-danger">حدث خطأ أثناء تحميل البيانات: ${error.message}</td></tr>`;
        }
    }

    function updateStatistics(students) {
        // Total students
        totalStudentsEl.textContent = students.length;

        // Male count
        const maleCount = students.filter(student => student.gender === 'male').length;
        maleCountEl.textContent = maleCount;

        // Female count
        const femaleCount = students.filter(student => student.gender === 'female').length;
        femaleCountEl.textContent = femaleCount;

        // Today's registrations
        const today = new Date().toISOString().split('T')[0];
        const todayCount = students.filter(student => {
            try {
                if (student.created_at) {
                    const studentDate = new Date(student.created_at).toISOString().split('T')[0];
                    return studentDate === today;
                }
                return false;
            } catch (error) {
                console.error('Error processing date in statistics:', error);
                return false;
            }
        }).length;
        todayCountEl.textContent = todayCount;
    }

    function populateGovernorateFilter(students) {
        // Get unique governorates
        const governorates = [...new Set(students.map(student => student.governorate))].filter(Boolean).sort();

        // Clear existing options except the first one
        while (filterGovernorate.options.length > 1) {
            filterGovernorate.remove(1);
        }

        // Add options
        governorates.forEach(governorate => {
            const option = document.createElement('option');
            option.value = governorate;
            option.textContent = governorate;
            filterGovernorate.appendChild(option);
        });
    }

    function displayStudents(students, page) {
        // Calculate pagination
        const totalPages = Math.ceil(students.length / studentsPerPage);
        const startIndex = (page - 1) * studentsPerPage;
        const endIndex = Math.min(startIndex + studentsPerPage, students.length);
        const studentsToDisplay = students.slice(startIndex, endIndex);

        // Clear table
        studentsTableBody.innerHTML = '';

        // Check if no students
        if (students.length === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4">لا توجد بيانات متطابقة مع معايير البحث</td></tr>';
            pagination.innerHTML = '';
            return;
        }

        // Add students to table
        studentsToDisplay.forEach((student, index) => {
            const row = document.createElement('tr');

            // Format date with error handling
            let registrationDate = '';
            try {
                if (student.created_at) {
                    registrationDate = new Date(student.created_at).toLocaleDateString('ar-EG');
                }
            } catch (error) {
                console.error('Error formatting date:', error);
                registrationDate = 'غير متوفر';
            }

            // Map values
            const genderText = student.gender === 'male' ? 'ذكر' : 'أنثى';
            const levelText = {
                'preliminary': 'تمهيدية',
                'intermediate': 'متوسطة',
                'specialized': 'تخصصية'
            }[student.level] || student.level;
            const attendanceText = {
                'inPerson': 'مباشر',
                'online': 'عن بعد'
            }[student.attendanceSystem] || student.attendanceSystem;

            row.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td>${student.fullName || ''}</td>
                <td>${student.nationalId || ''}</td>
                <td>${student.phoneNumber || ''}</td>
                <td>${genderText}</td>
                <td>${student.governorate || ''}</td>
                <td>${student.seatNumber || ''}</td>
                <td>${levelText}</td>
                <td>${attendanceText}</td>
                <td>${registrationDate}</td>
                <td>
                    <button class="btn btn-sm btn-info view-details" data-id="${student.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;

            studentsTableBody.appendChild(row);
        });

        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', () => {
                const studentId = button.getAttribute('data-id');
                const student = students.find(s => s.id === studentId);
                if (student) {
                    showStudentDetails(student);
                }
            });
        });

        // Update pagination
        updatePagination(totalPages, page);
    }

    function updatePagination(totalPages, currentPage) {
        pagination.innerHTML = '';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
        pagination.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                goToPage(i);
            });
            pagination.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                goToPage(currentPage + 1);
            }
        });
        pagination.appendChild(nextLi);
    }

    function goToPage(page) {
        currentPage = page;
        displayStudents(filteredStudents, currentPage);
    }

    function applyFilters() {
        const governorate = filterGovernorate.value;
        const level = filterLevel.value;
        const gender = filterGender.value;
        const attendance = filterAttendance.value;

        filteredStudents = allStudents.filter(student => {
            return (
                (governorate === '' || student.governorate === governorate) &&
                (level === '' || student.level === level) &&
                (gender === '' || student.gender === gender) &&
                (attendance === '' || student.attendanceSystem === attendance)
            );
        });

        currentPage = 1;
        displayStudents(filteredStudents, currentPage);
        updateStatistics(filteredStudents);
    }

    function resetFilters() {
        filterGovernorate.value = '';
        filterLevel.value = '';
        filterGender.value = '';
        filterAttendance.value = '';
        searchInput.value = '';

        filteredStudents = [...allStudents];
        currentPage = 1;
        displayStudents(filteredStudents, currentPage);
        updateStatistics(filteredStudents);
    }

    function searchStudents() {
        const searchTerm = searchInput.value.trim().toLowerCase();

        if (searchTerm === '') {
            filteredStudents = [...allStudents];
        } else {
            filteredStudents = allStudents.filter(student => {
                return (
                    (student.fullName && student.fullName.toLowerCase().includes(searchTerm)) ||
                    (student.nationalId && student.nationalId.includes(searchTerm)) ||
                    (student.phoneNumber && student.phoneNumber.includes(searchTerm))
                );
            });
        }

        currentPage = 1;
        displayStudents(filteredStudents, currentPage);
        updateStatistics(filteredStudents);
    }

    function showStudentDetails(student) {
        const modal = new bootstrap.Modal(document.getElementById('studentDetailsModal'));
        const modalContent = document.getElementById('studentDetailsContent');

        // Format values
        const genderText = student.gender === 'male' ? 'ذكر' : 'أنثى';
        const levelText = {
            'preliminary': 'تمهيدية',
            'intermediate': 'متوسطة',
            'specialized': 'تخصصية'
        }[student.level] || student.level;
        const attendanceText = {
            'inPerson': 'مباشر',
            'online': 'عن بعد'
        }[student.attendanceSystem] || student.attendanceSystem;
        const specialNeedsText = student.specialNeeds ? 'نعم' : 'لا';

        // Format date with error handling
        let registrationDate = 'غير متوفر';
        try {
            if (student.created_at) {
                registrationDate = new Date(student.created_at).toLocaleDateString('ar-EG');
            }
        } catch (error) {
            console.error('Error formatting date in details:', error);
        }

        // Create content
        modalContent.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">الاسم الرباعي:</p>
                    <p>${student.fullName || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">الرقم القومي:</p>
                    <p>${student.nationalId || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">رقم جواز السفر:</p>
                    <p>${student.passportNumber || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">رقم الهاتف:</p>
                    <p>${student.phoneNumber || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">النوع:</p>
                    <p>${genderText}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">السن:</p>
                    <p>${student.age || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">المحافظة:</p>
                    <p>${student.governorate || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">رقم الجلوس:</p>
                    <p>${student.seatNumber || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">محل الإقامة:</p>
                    <p>${student.residenceAddress || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">المؤهل الدراسي:</p>
                    <p>${student.educationalQualification || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">نوع التعليم:</p>
                    <p>${student.educationType || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">الوظيفة:</p>
                    <p>${student.occupation || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">جهة العمل:</p>
                    <p>${student.workPlace || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">الكلية:</p>
                    <p>${student.college || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">السنة الدراسية:</p>
                    <p>${student.academicYear || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">المرحلة:</p>
                    <p>${levelText}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">قسم المرحلة التخصصية:</p>
                    <p>${student.specializedDepartment || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">المذهب:</p>
                    <p>${student.doctrine || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">نوع الدراسة:</p>
                    <p>${attendanceText}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">من ذوي الهمم:</p>
                    <p>${specialNeedsText}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">الرقم المرجعي لايصال الدفع:</p>
                    <p>${student.paymentReferenceNumber || '-'}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <p class="fw-bold mb-1">تاريخ التسجيل:</p>
                    <p>${registrationDate}</p>
                </div>
            </div>

            <h5 class="mt-4 mb-3 border-bottom pb-2">المستندات</h5>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <p class="fw-bold mb-1">صورة البطاقة:</p>
                    ${student.idCardImage ? `<a href="${student.idCardImage}" target="_blank" class="btn btn-sm btn-primary">عرض</a>` : '-'}
                </div>
                <div class="col-md-4 mb-3">
                    <p class="fw-bold mb-1">صورة المؤهل:</p>
                    ${student.qualificationImage ? `<a href="${student.qualificationImage}" target="_blank" class="btn btn-sm btn-primary">عرض</a>` : '-'}
                </div>
                <div class="col-md-4 mb-3">
                    <p class="fw-bold mb-1">صورة ايصال الدفع:</p>
                    ${student.paymentReceiptImage ? `<a href="${student.paymentReceiptImage}" target="_blank" class="btn btn-sm btn-primary">عرض</a>` : '-'}
                </div>
            </div>
        `;

        modal.show();
    }

    // Handle Excel file selection
    function handleExcelFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check file type
        const fileType = file.name.split('.').pop().toLowerCase();
        if (fileType !== 'xlsx' && fileType !== 'xls') {
            alert('يرجى اختيار ملف Excel بامتداد .xlsx أو .xls');
            event.target.value = '';
            return;
        }

        // Preview file info
        importResults.innerHTML = `
            <div class="alert alert-info">
                <p><strong>الملف المختار:</strong> ${file.name}</p>
                <p><strong>حجم الملف:</strong> ${(file.size / 1024).toFixed(2)} كيلوبايت</p>
                <p>انقر على زر "استيراد البيانات" لبدء عملية الاستيراد.</p>
            </div>
        `;

        // Enable import button
        confirmImportBtn.disabled = false;
    }

    // Create Excel template for data import
    function createExcelTemplate() {
        try {
            // Define headers in Arabic
            const headers = [
                'الاسم الرباعي',
                'رقم الجلوس',
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
                'الرقم المرجعي لايصال الدفع'
            ];

            // Create example data row with descriptions
            const exampleRow = [
                'مثال: محمد أحمد علي محمود',
                'مثال: 12345',
                'مثال: 29912345678912',
                'مثال: A12345678 (اختياري)',
                'مثال: 01012345678',
                'اكتب: ذكر أو أنثى',
                'مثال: 25',
                'اختر من: القاهرة، الجيزة، الإسكندرية، إلخ',
                'مثال: شارع النصر - المعادي',
                'مثال: بكالوريوس',
                'مثال: أزهري',
                'مثال: مدرس',
                'مثال: وزارة التربية والتعليم',
                'مثال: كلية الشريعة (اختياري)',
                'مثال: الرابعة (اختياري)',
                'اختر من: تمهيدية، متوسطة، تخصصية',
                'مثال: فقه شافعي (للمرحلة التخصصية فقط)',
                'اختر من: حنفي، مالكي، شافعي، حنبلي',
                'اختر من: مباشر، عن بعد',
                'اكتب: نعم أو لا',
                'مثال: REF123456'
            ];

            // Create a second empty row for the user to fill
            const emptyRow = Array(headers.length).fill('');

            // Create worksheet
            const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow, emptyRow]);

            // Set column widths
            ws['!cols'] = headers.map(() => ({ wch: 25 }));

            // Add notes in a separate sheet
            const notesData = [
                ['ملاحظات هامة لملء النموذج:'],
                [''],
                ['1. يجب ملء الحقول التالية على الأقل: الاسم الرباعي، رقم الجلوس أو الرقم القومي'],
                ['2. حقل "النوع" يجب أن يكون "ذكر" أو "أنثى"'],
                ['3. حقل "المرحلة" يجب أن يكون "تمهيدية" أو "متوسطة" أو "تخصصية"'],
                ['4. حقل "نوع الدراسة" يجب أن يكون "مباشر" أو "عن بعد"'],
                ['5. حقل "من ذوي الهمم" يجب أن يكون "نعم" أو "لا"'],
                ['6. يمكنك إضافة صفوف جديدة حسب الحاجة'],
                ['7. لا تقم بتغيير أسماء الأعمدة'],
                ['8. يمكنك حذف صف المثال قبل رفع الملف']
            ];

            const notesWs = XLSX.utils.aoa_to_sheet(notesData);

            // Create workbook and add worksheets
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'بيانات الطلاب');
            XLSX.utils.book_append_sheet(wb, notesWs, 'ملاحظات');

            // Generate Excel file and trigger download
            XLSX.writeFile(wb, `نموذج_تسجيل_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error('Error creating Excel template:', error);
            alert('حدث خطأ أثناء إنشاء نموذج Excel. يرجى المحاولة مرة أخرى.');
        }
    }

    // Process Excel import
    async function processExcelImport() {
        const file = excelFileInput.files[0];
        if (!file) {
            alert('يرجى اختيار ملف Excel أولاً');
            return;
        }

        try {
            // Show progress bar
            importProgress.classList.remove('d-none');
            confirmImportBtn.disabled = true;

            // Read Excel file
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

                    // Map Excel headers to our field names
                    const headerRow = jsonData[0];
                    const headerMap = {};

                    // Define mapping between Arabic headers and field names
                    const arabicToFieldMap = {
                        'الاسم الرباعي': 'fullName',
                        'الاسم': 'fullName',
                        'الاسم الكامل': 'fullName',
                        'رقم الجلوس': 'seatNumber',
                        'الرقم القومي': 'nationalId',
                        'رقم البطاقة': 'nationalId',
                        'رقم جواز السفر': 'passportNumber',
                        'المحافظة': 'governorate',
                        'رقم الهاتف': 'phoneNumber',
                        'الهاتف': 'phoneNumber',
                        'النوع': 'gender',
                        'الجنس': 'gender',
                        'السن': 'age',
                        'العمر': 'age',
                        'محل الإقامة': 'residenceAddress',
                        'المؤهل الدراسي': 'educationalQualification',
                        'نوع التعليم': 'educationType',
                        'الوظيفة': 'occupation',
                        'جهة العمل': 'workPlace',
                        'الكلية': 'college',
                        'السنة الدراسية': 'academicYear',
                        'المرحلة': 'level',
                        'قسم المرحلة التخصصية': 'specializedDepartment',
                        'المذهب': 'doctrine',
                        'نوع الدراسة': 'attendanceSystem',
                        'من ذوي الهمم': 'specialNeeds',
                        'الرقم المرجعي لايصال الدفع': 'paymentReferenceNumber'
                    };

                    // Map headers
                    for (const col in headerRow) {
                        const headerText = headerRow[col];
                        if (headerText && typeof headerText === 'string') {
                            const fieldName = arabicToFieldMap[headerText.trim()];
                            if (fieldName) {
                                headerMap[col] = fieldName;
                            }
                        }
                    }

                    // Convert gender values if needed
                    const genderMap = {
                        'ذكر': 'male',
                        'أنثى': 'female',
                        'male': 'male',
                        'female': 'female'
                    };

                    // Convert level values if needed
                    const levelMap = {
                        'تمهيدية': 'preliminary',
                        'متوسطة': 'intermediate',
                        'تخصصية': 'specialized',
                        'preliminary': 'preliminary',
                        'intermediate': 'intermediate',
                        'specialized': 'specialized'
                    };

                    // Convert attendance system values if needed
                    const attendanceMap = {
                        'مباشر': 'inPerson',
                        'عن بعد': 'online',
                        'inPerson': 'inPerson',
                        'online': 'online'
                    };

                    // Process data rows (skip header)
                    const dataToImport = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        const studentData = {};

                        // Map fields using the header map
                        for (const col in row) {
                            const fieldName = headerMap[col];
                            if (fieldName) {
                                let value = row[col];

                                // Convert special fields
                                if (fieldName === 'gender' && value) {
                                    value = genderMap[value] || value;
                                } else if (fieldName === 'level' && value) {
                                    value = levelMap[value] || value;
                                } else if (fieldName === 'attendanceSystem' && value) {
                                    value = attendanceMap[value] || value;
                                } else if (fieldName === 'specialNeeds' && value) {
                                    // Convert "نعم" to true and "لا" to false
                                    if (typeof value === 'string') {
                                        value = value.trim() === 'نعم';
                                    } else if (typeof value === 'boolean') {
                                        value = value;
                                    } else {
                                        value = false;
                                    }
                                }

                                studentData[fieldName] = value;
                            }
                        }

                        // Add to import data if it has required fields
                        if (studentData.fullName && (studentData.nationalId || studentData.seatNumber)) {
                            dataToImport.push(studentData);
                        }
                    }

                    // Import data to Supabase
                    const result = await window.supabaseApi.importFromExcel(dataToImport, (progress) => {
                        importProgress.querySelector('.progress-bar').style.width = `${progress}%`;
                    });

                    if (result.success) {
                        // Show results
                        const { results } = result;
                        importResults.innerHTML = `
                            <div class="alert alert-success">
                                <h6>تم استيراد البيانات بنجاح!</h6>
                                <p>إجمالي الصفوف: ${results.total}</p>
                                <p>تمت إضافة: ${results.added} سجل</p>
                                <p>تم تحديث: ${results.updated} سجل</p>
                                <p>أخطاء: ${results.errors.length}</p>
                            </div>
                        `;

                        if (results.errors.length > 0) {
                            importResults.innerHTML += `
                                <div class="alert alert-warning">
                                    <h6>الأخطاء:</h6>
                                    <ul>
                                        ${results.errors.map(error => `<li>${error}</li>`).join('')}
                                    </ul>
                                </div>
                            `;
                        }

                        // Reload students data
                        loadStudents();
                    } else {
                        throw new Error(result.error);
                    }
                } catch (error) {
                    console.error('Error processing Excel file:', error);
                    importResults.innerHTML = `
                        <div class="alert alert-danger">
                            <h6>حدث خطأ أثناء معالجة الملف:</h6>
                            <p>${error.message}</p>
                        </div>
                    `;
                } finally {
                    // Reset file input
                    excelFileInput.value = '';
                    confirmImportBtn.disabled = false;
                }
            };

            reader.onerror = function() {
                importResults.innerHTML = `
                    <div class="alert alert-danger">
                        <h6>حدث خطأ أثناء قراءة الملف</h6>
                    </div>
                `;
                confirmImportBtn.disabled = false;
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error importing Excel file:', error);
            importResults.innerHTML = `
                <div class="alert alert-danger">
                    <h6>حدث خطأ أثناء استيراد الملف:</h6>
                    <p>${error.message}</p>
                </div>
            `;
            confirmImportBtn.disabled = false;
        }
    }
});
