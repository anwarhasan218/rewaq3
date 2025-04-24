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
            qualificationImage.removeAttribute('required');
        } else {
            qualificationRequired.textContent = '(مطلوب للمرحلة المتوسطة والتخصصية)';
            qualificationImage.setAttribute('required', '');
        }
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

        // Handle file uploads
        const uploadFiles = async () => {
            try {
                // Upload ID card image
                if (idCardImage.files && idCardImage.files[0]) {
                    const idCardResult = await window.supabaseClient.uploadFile(
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
                    const qualificationResult = await window.supabaseClient.uploadFile(
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
                    const paymentReceiptResult = await window.supabaseClient.uploadFile(
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

        // Save student data
        const saveStudent = async () => {
            try {
                // Upload files
                const uploadResult = await uploadFiles();

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error);
                }

                // Convert specialNeeds to boolean
                data.specialNeeds = !!data.specialNeeds;

                // Add created_at timestamp
                data.created_at = new Date().toISOString();

                // Save to Supabase
                const result = await window.supabaseClient.saveStudentData(data);

                if (!result.success) {
                    throw new Error(result.error);
                }

                // Show success message
                successMessage.classList.remove('d-none');

                // Reset form
                form.reset();
                form.classList.remove('was-validated');

                // Hide previews
                idCardPreviewContainer.classList.add('d-none');
                qualificationPreviewContainer.classList.add('d-none');
                paymentReceiptPreviewContainer.classList.add('d-none');

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
});
