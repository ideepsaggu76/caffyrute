// Contact Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const messageTextarea = document.getElementById('message');
    const charCount = document.getElementById('char-count');

    // Character counter for message
    messageTextarea.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = count;
        
        if (count > 1000) {
            charCount.style.color = 'var(--error-red)';
            this.value = this.value.substring(0, 1000);
            charCount.textContent = '1000';
        } else if (count > 900) {
            charCount.style.color = 'var(--warning-orange)';
        } else {
            charCount.style.color = 'var(--text-light)';
        }
    });

    // Form validation
    function validateForm() {
        let isValid = true;
        const requiredFields = ['firstName', 'lastName', 'email', 'subject', 'message'];
        
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const formGroup = field.closest('.form-group');
            
            // Remove existing error states
            formGroup.classList.remove('error', 'success');
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Validate field
            if (!field.value.trim()) {
                showFieldError(formGroup, field, 'This field is required');
                isValid = false;
            } else if (fieldName === 'email' && !isValidEmail(field.value)) {
                showFieldError(formGroup, field, 'Please enter a valid email address');
                isValid = false;
            } else {
                formGroup.classList.add('success');
            }
        });

        // Validate privacy checkbox
        const privacyCheckbox = document.getElementById('privacy');
        const privacyGroup = privacyCheckbox.closest('.form-group');
        privacyGroup.classList.remove('error');
        const existingPrivacyError = privacyGroup.querySelector('.error-message');
        if (existingPrivacyError) {
            existingPrivacyError.remove();
        }

        if (!privacyCheckbox.checked) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'You must agree to the privacy policy to continue';
            privacyGroup.appendChild(errorDiv);
            privacyGroup.classList.add('error');
            isValid = false;
        }

        return isValid;
    }

    function showFieldError(formGroup, field, message) {
        formGroup.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('Please fix the errors above', 'error');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';

        // Simulate form submission (replace with actual API call)
        try {
            await simulateFormSubmission();
            
            // Success state
            showToast('✅ Message sent successfully! We\'ll get back to you soon.', 'success');
            contactForm.reset();
            charCount.textContent = '0';
            
            // Remove success/error states
            document.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error', 'success');
                const errorMsg = group.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            });
            
        } catch (error) {
            showToast('❌ Failed to send message. Please try again.', 'error');
        } finally {
            // Reset button state
            setTimeout(() => {
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }, 1000);
        }
    });

    // Simulate form submission
    function simulateFormSubmission() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 90% success rate for demo
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error('Submission failed'));
                }
            }, 2000);
        });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active', !isActive);
        });
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
        }
        e.target.value = value;
    });

    // Real-time validation
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const formGroup = this.closest('.form-group');
            formGroup.classList.remove('error', 'success');
            
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            if (this.hasAttribute('required') && !this.value.trim()) {
                showFieldError(formGroup, this, 'This field is required');
            } else if (this.type === 'email' && this.value && !isValidEmail(this.value)) {
                showFieldError(formGroup, this, 'Please enter a valid email address');
            } else if (this.value.trim()) {
                formGroup.classList.add('success');
            }
        });
    });

    // Smooth animations for contact methods
    const contactMethods = document.querySelectorAll('.contact-method');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    contactMethods.forEach((method, index) => {
        method.style.opacity = '0';
        method.style.transform = 'translateY(30px)';
        method.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(method);
    });

    // Copy contact info to clipboard
    document.querySelectorAll('.method-details p').forEach(element => {
        if (element.textContent.includes('@') || element.textContent.includes('+')) {
            element.style.cursor = 'pointer';
            element.title = 'Click to copy';
            
            element.addEventListener('click', function() {
                navigator.clipboard.writeText(this.textContent).then(() => {
                    showToast('📋 Copied to clipboard!', 'success');
                });
            });
        }
    });
});

// Enhanced toast function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    // Update icon based on type
    const icon = toast.querySelector('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-info-circle';
    }
    
    toastMessage.innerHTML = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
