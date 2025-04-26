document.addEventListener('DOMContentLoaded', () => {
    // Get all practice buttons
    const practiceButtons = document.querySelectorAll('.start-practice');

    // Add click event listeners to practice buttons
    practiceButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const practiceType = e.target.closest('.start-practice').dataset.type;
            startPractice(practiceType);
        });
    });

    // Handle mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
    });
});

function startPractice(type) {
    // Show loading state on button
    const button = document.querySelector(`[data-type="${type}"]`);
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    button.disabled = true;

    // Simulate loading delay (remove in production and replace with actual API call)
    setTimeout(() => {
        // Reset button state
        button.innerHTML = originalContent;
        button.disabled = false;

        // Redirect to appropriate practice page based on type
        switch(type) {
            case 'technical':
                window.location.href = '/technical-interview.html';
                break;
            case 'behavioral':
                window.location.href = '/behavioral-interview.html';
                break;
            case 'system':
                window.location.href = '/system-design.html';
                break;
            default:
                console.error('Unknown practice type');
        }
    }, 1000);
} 