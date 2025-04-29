// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const form = document.getElementById('registrationForm');
    const levelSelect = document.getElementById('level');
    const specializedDepartmentContainer = document.getElementById('specializedDepartmentContainer');
    const specializedDepartmentInput = document.getElementById('specializedDepartment');
    const qualificationRequired = document.getElementById('qualificationRequired');
    const qualificationImage = document.getElementById('qualificationImage');

    // Get file input elements
    const idCardImage = document.getElementById('idCardImage');
    const qualificationImageInput = document.getElementById('qualificationImage');
    const paymentReceiptImage = document.getElementById('paymentReceiptImage');

    // Get preview elements
    const idCardPreview = document.getElementById('idCardPreview');
    const idCardPreviewContainer = document.getElementById('idCardPreviewContainer');
    const qualificationPreview = document.getElementById('qualificationPreview');
    const qualificationPreviewContainer = document.getElementById('qualificationPreviewContainer');
    const paymentReceiptPreview = document.getElementById('paymentReceiptPreview');
    const paymentReceiptPreviewContainer = document.getElementById('paymentReceiptPreviewContainer');

    // Get button elements
    const submitButton = document.getElementById('submitButton');
    const submitText = document.getElementById('submitText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const updateButton = document.getElementById('updateButton');
    const updateText = document.getElementById('updateText');
    const updateSpinner = document.getElementById('updateSpinner');
    const searchBtn = document.getElementById('searchBtn');
    const newRegistrationBtn = document.getElementById('newRegistrationBtn');

    // Get search elements
    const searchTerm = document.getElementById('searchTerm');
    const searchMessage = document.getElementById('searchMessage');

    // Get hidden fields
    const studentId = document.getElementById('studentId');
    const formMode = document.getElementById('formMode');

    // Get message elements
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    // Handle level change
    levelSelect.addEventListener('change', function() {
        const selectedLevel = this.value;

        // Show/hide specialized department field
        if (selectedLevel === 'specialized') {
            specializedDepartmentContainer.classList.remove('d-none');
            specializedDepartmentInput.setAttribute('required', '');
        } else {
            specializedDepartmentContainer.classList.add('d-none');
            specializedDepartmentInput.removeAttribute('required');
        }

        // Update qualification requirements
        if (selectedLevel === 'preliminary') {
            qualificationRequired.textContent = '(اختياري للمرحلة التمهيدية)';
        } else {
            qualificationRequired.textContent = '(اختياري للمرحلة المتوسطة والتخصصية)';
        }
        // جعل حقل صورة المؤهل اختياري دائماً
        qualificationImage.removeAttribute('required');
    });

    // Handle file preview for ID card
    idCardImage.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                idCardPreview.src = e.target.result;
                idCardPreviewContainer.classList.remove('d-none');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Handle file preview for qualification
    qualificationImageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                qualificationPreview.src = e.target.result;
                qualificationPreviewContainer.classList.remove('d-none');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Handle file preview for payment receipt
    paymentReceiptImage.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                paymentReceiptPreview.src = e.target.result;
                paymentReceiptPreviewContainer.classList.remove('d-none');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Handle search button click
    searchBtn.addEventListener('click', searchStudent);

    // Handle search on Enter key
    searchTerm.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchStudent();
        }
    });

    // Handle new registration button click
    newRegistrationBtn.addEventListener('click', resetForm);

    // Handle update button click
    updateButton.addEventListener('click', updateStudentData);

    // Search for student
    async function searchStudent() {
        const term = searchTerm.value.trim();
        if (!term) {
            alert('يرجى إدخال الرقم القومي أو رقم الجلوس للبحث');
            return;
        }

        // Show loading message
        searchMessage.textContent = 'جاري البحث...';
        searchMessage.classList.remove('d-none');
        successMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');
        searchBtn.disabled = true;

        try {
            // Search for student
            const result = await window.supabaseApi.searchStudent(term);

            if (!result.success) {
                throw new Error(result.error);
            }

            if (result.data.length === 0) {
                // No student found
                searchMessage.textContent = 'لم يتم العثور على بيانات مطابقة. يمكنك إدخال بيانات جديدة.';
                searchMessage.classList.remove('d-none');
                return;
            }

            // Student found, fill form with data
            const student = result.data[0];
            fillFormWithStudentData(student);

            // Hide search message
            searchMessage.classList.add('d-none');

            // Show success message
            successMessage.textContent = 'تم العثور على البيانات. يمكنك تعديلها والضغط على زر "تعديل البيانات".';
            successMessage.classList.remove('d-none');

        } catch (error) {
            // Show error message
            errorMessage.textContent = error.message || 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.';
            errorMessage.classList.remove('d-none');
            searchMessage.classList.add('d-none');
        } finally {
            searchBtn.disabled = false;
        }
    }

    // Fill form with student data
    function fillFormWithStudentData(student) {
        // Set form mode to edit
        formMode.value = 'edit';
        studentId.value = student.id;

        // Show update button and hide submit button
        updateButton.classList.remove('d-none');

        // List of fields to fill (exclude file inputs and images)
        const fieldsToFill = [
            'fullName', 'nationalId', 'passportNumber', 'phoneNumber', 'gender',
            'age', 'governorate', 'seatNumber', 'residenceAddress', 'educationalQualification',
            'educationType', 'occupation', 'workPlace', 'college', 'academicYear',
            'level', 'specializedDepartment', 'doctrine', 'attendanceSystem', 'specialNeeds',
            'paymentReferenceNumber'
        ];

        // Fill each field if it exists in student data
        fieldsToFill.forEach(field => {
            const element = document.getElementById(field);
            if (element && student[field] !== undefined) {
                if (element.type === 'checkbox') {
                    element.checked = student[field];
                } else if (element.tagName === 'SELECT') {
                    element.value = student[field] || '';
                    // Trigger change event for select elements
                    const event = new Event('change');
                    element.dispatchEvent(event);
                } else {
                    element.value = student[field] || '';
                }
            }
        });

        // Handle image previews
        if (student.idCardImage) {
            idCardPreview.src = student.idCardImage;
            idCardPreviewContainer.classList.remove('d-none');
        }

        if (student.qualificationImage) {
            qualificationPreview.src = student.qualificationImage;
            qualificationPreviewContainer.classList.remove('d-none');
        }

        if (student.paymentReceiptImage) {
            paymentReceiptPreview.src = student.paymentReceiptImage;
            paymentReceiptPreviewContainer.classList.remove('d-none');
        }

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    // Reset form to new registration mode
    function resetForm() {
        // Reset form
        form.reset();
        form.classList.remove('was-validated');

        // Hide previews
        idCardPreviewContainer.classList.add('d-none');
        qualificationPreviewContainer.classList.add('d-none');
        paymentReceiptPreviewContainer.classList.add('d-none');

        // Reset form mode
        formMode.value = 'new';
        studentId.value = '';

        // Hide update button
        updateButton.classList.add('d-none');

        // Hide messages
        successMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');
        searchMessage.classList.add('d-none');

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    }

    // Update student data
    async function updateStudentData() {
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Show loading state
        updateText.textContent = 'جاري التعديل...';
        updateSpinner.classList.remove('d-none');
        updateButton.disabled = true;

        // Hide any previous messages
        successMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');

        // Get form data as an object
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            // Upload files
            const uploadResult = await uploadFiles(data);

            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            // Convert specialNeeds to boolean
            data.specialNeeds = !!data.specialNeeds;

            // Preserve existing image URLs if no new files are uploaded
            if (!idCardImage.files || !idCardImage.files[0]) {
                const idCardPreviewSrc = idCardPreview.getAttribute('src');
                if (idCardPreviewSrc && !idCardPreviewSrc.includes('data:image')) {
                    data.idCardImage = idCardPreviewSrc;
                }
            }

            if (!qualificationImageInput.files || !qualificationImageInput.files[0]) {
                const qualificationPreviewSrc = qualificationPreview.getAttribute('src');
                if (qualificationPreviewSrc && !qualificationPreviewSrc.includes('data:image')) {
                    data.qualificationImage = qualificationPreviewSrc;
                }
            }

            if (!paymentReceiptImage.files || !paymentReceiptImage.files[0]) {
                const paymentReceiptPreviewSrc = paymentReceiptPreview.getAttribute('src');
                if (paymentReceiptPreviewSrc && !paymentReceiptPreviewSrc.includes('data:image')) {
                    data.paymentReceiptImage = paymentReceiptPreviewSrc;
                }
            }

            // Remove file input fields from data to avoid errors
            delete data.idCardImage_file;
            delete data.qualificationImage_file;
            delete data.paymentReceiptImage_file;

            // Store studentId before deleting it from data
            const studentId = data.studentId;

            // Remove form_mode and studentId fields to prevent database errors
            delete data.formMode;
            delete data.studentId;

            // Update student data
            const result = await window.supabaseApi.updateStudentData(studentId, data);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Show success message
            successMessage.textContent = 'تم تعديل البيانات بنجاح!';
            successMessage.classList.remove('d-none');

        } catch (error) {
            // Show error message
            errorMessage.textContent = error.message || 'حدث خطأ أثناء تعديل البيانات. يرجى المحاولة مرة أخرى.';
            errorMessage.classList.remove('d-none');
        } finally {
            // Reset button state
            updateText.textContent = 'تعديل البيانات';
            updateSpinner.classList.add('d-none');
            updateButton.disabled = false;
        }
    }

    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Validate form
        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // Show loading state
        submitText.textContent = 'جاري التسجيل...';
        loadingSpinner.classList.remove('d-none');
        submitButton.disabled = true;

        // Hide any previous messages
        successMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');

        // Get form data as an object
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Save student data
        const saveStudent = async () => {
            try {
                // التحقق من عدم تكرار الرقم القومي
                if (data.nationalId) {
                    const searchResult = await window.supabaseApi.searchStudent(data.nationalId);
                    
                    if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
                        // الرقم القومي موجود بالفعل
                        throw new Error('هذا الرقم القومي مسجل بالفعل. لا يمكن تكرار التسجيل بنفس الرقم القومي.');
                    }
                }
                
                // Upload files
                const uploadResult = await uploadFiles(data);

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error);
                }

                // Convert specialNeeds to boolean
                data.specialNeeds = !!data.specialNeeds;

                // Add created_at timestamp
                data.created_at = new Date().toISOString();

                // Remove form_mode and studentId fields to prevent database errors
                delete data.formMode;
                delete data.studentId;

                // Remove file input fields
                delete data.idCardImage_file;
                delete data.qualificationImage_file;
                delete data.paymentReceiptImage_file;

                // Save to Supabase
                const result = await window.supabaseApi.saveStudentData(data);

                if (!result.success) {
                    throw new Error(result.error);
                }

                // Show success message
                successMessage.textContent = 'تم تسجيل البيانات بنجاح!';
                successMessage.classList.remove('d-none');
                
                // التمرير إلى رسالة النجاح
                successMessage.scrollIntoView({ behavior: 'smooth' });

                // Reset form
                resetForm();

                return { success: true };
            } catch (error) {
                // Show error message
                errorMessage.textContent = error.message || 'حدث خطأ أثناء تسجيل البيانات. يرجى المحاولة مرة أخرى.';
                errorMessage.classList.remove('d-none');

                return { success: false, error: error.message };
            }
        };

        // Execute save operation
        saveStudent().finally(() => {
            // Reset button state
            submitText.textContent = 'تسجيل البيانات';
            loadingSpinner.classList.add('d-none');
            submitButton.disabled = false;
        });
    });

    // Handle file uploads
    async function uploadFiles(data) {
        try {
            // Upload ID card image
            if (idCardImage.files && idCardImage.files[0]) {
                const idCardResult = await window.supabaseApi.uploadFile(
                    idCardImage.files[0],
                    'student-documents',
                    'id-cards'
                );

                if (!idCardResult.success) {
                    throw new Error('فشل في رفع صورة البطاقة: ' + idCardResult.error);
                }

                data.idCardImage = idCardResult.url;
            }

            // Upload qualification image
            if (qualificationImageInput.files && qualificationImageInput.files[0]) {
                const qualificationResult = await window.supabaseApi.uploadFile(
                    qualificationImageInput.files[0],
                    'student-documents',
                    'qualifications'
                );

                if (!qualificationResult.success) {
                    throw new Error('فشل في رفع صورة المؤهل: ' + qualificationResult.error);
                }

                data.qualificationImage = qualificationResult.url;
            }

            // Upload payment receipt image
            if (paymentReceiptImage.files && paymentReceiptImage.files[0]) {
                const paymentReceiptResult = await window.supabaseApi.uploadFile(
                    paymentReceiptImage.files[0],
                    'student-documents',
                    'payment-receipts'
                );

                if (!paymentReceiptResult.success) {
                    throw new Error('فشل في رفع صورة ايصال الدفع: ' + paymentReceiptResult.error);
                }

                data.paymentReceiptImage = paymentReceiptResult.url;
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };
});
