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
});
