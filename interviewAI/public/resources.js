// Resource URLs
const resourceLinks = {
    technicalGuide: {
        google: 'https://www.google.com/search?q=technical+coding+interview+preparation',
        youtube: 'https://www.youtube.com/results?search_query=coding+interview+preparation'
    },
    behavioralQuestions: {
        google: 'https://www.google.com/search?q=behavioral+interview+STAR+method',
        youtube: 'https://www.youtube.com/results?search_query=behavioral+interview+tips'
    },
    interviewTips: {
        google: 'https://www.google.com/search?q=interview+tips+and+tricks',
        youtube: 'https://www.youtube.com/results?search_query=interview+body+language+tips'
    }
};

// Function to create resource modal
function createResourceModal(type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Choose Resource Type</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn btn-primary" onclick="window.open('${resourceLinks[type].google}', '_blank')">
                        <i class="fab fa-google"></i> Google Resources
                    </button>
                    <button class="btn btn-primary" style="background-color: #ff0000;" onclick="window.open('${resourceLinks[type].youtube}', '_blank')">
                        <i class="fab fa-youtube"></i> YouTube Tutorials
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Add click event listeners to resource buttons
document.addEventListener('DOMContentLoaded', () => {
    // Technical Guide button
    const technicalBtn = document.querySelector('.resource-card:nth-child(1) .btn');
    technicalBtn.onclick = (e) => {
        e.preventDefault();
        createResourceModal('technicalGuide');
    };

    // Behavioral Questions button
    const behavioralBtn = document.querySelector('.resource-card:nth-child(2) .btn');
    behavioralBtn.onclick = (e) => {
        e.preventDefault();
        createResourceModal('behavioralQuestions');
    };

    // Interview Tips button
    const tipsBtn = document.querySelector('.resource-card:nth-child(3) .btn');
    tipsBtn.onclick = (e) => {
        e.preventDefault();
        createResourceModal('interviewTips');
    };
});

// Handle mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
}); 