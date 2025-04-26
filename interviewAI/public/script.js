document.addEventListener('DOMContentLoaded', function() {
    // API URL 
    const API_URL = 'http://localhost:3000/api';
    
    // DOM Elements
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showSignupBtn = document.getElementById('showSignupBtn');
    
    const startInterviewBtn = document.getElementById('startInterviewBtn');
    const categoryCards = document.querySelectorAll('.category-card');
    
    const interviewModal = document.getElementById('interviewModal');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    const interviewSetup = document.getElementById('interviewSetup');
    const interviewSession = document.getElementById('interviewSession');
    const interviewResults = document.getElementById('interviewResults');
    
    const interviewConfigForm = document.getElementById('interviewConfigForm');
    const skipBtn = document.getElementById('skipBtn');
    const submitAnswerBtn = document.getElementById('submitAnswerBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const newInterviewBtn = document.getElementById('newInterviewBtn');
    const saveResultsBtn = document.getElementById('saveResultsBtn');
    
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    // State
    let currentUser = null;
    let currentInterview = {
        questions: [],
        answers: [],
        feedback: [],
        currentQuestionIndex: 0,
        settings: {}
    };
    let timer = null;
    let timeLeft = 0;
    
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUserUI();
    }
    
    // Event Listeners
    menuToggle.addEventListener('click', toggleMenu);
    
    loginBtn.addEventListener('click', () => openModal(loginModal));
    signupBtn.addEventListener('click', () => openModal(signupModal));
    logoutBtn.addEventListener('click', handleLogout);
    showLoginBtn.addEventListener('click', () => {
        closeModal(signupModal);
        openModal(loginModal);
    });
    showSignupBtn.addEventListener('click', () => {
        closeModal(loginModal);
        openModal(signupModal);
    });
    
    startInterviewBtn.addEventListener('click', () => openModal(interviewModal));
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            openInterviewSetup(category);
        });
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });
    
    interviewConfigForm.addEventListener('submit', handleInterviewStart);
    skipBtn.addEventListener('click', handleSkipQuestion);
    submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
    nextQuestionBtn.addEventListener('click', handleNextQuestion);
    newInterviewBtn.addEventListener('click', resetInterview);
    saveResultsBtn.addEventListener('click', saveInterviewResults);
    
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    // Functions
    function toggleMenu() {
        navLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
    }
    
    function openModal(modal) {
        modal.classList.remove('hidden');
    }
    
    function closeModal(modal) {
        modal.classList.add('hidden');
        
        // Reset interview sections if closing interview modal
        if (modal === interviewModal) {
            resetInterview();
        }
    }
    
    function openInterviewSetup(category) {
        // Pre-select the category in the form
        const interviewTypeSelect = document.getElementById('interviewType');
        if (category === 'tech') {
            interviewTypeSelect.value = 'technical';
        } else if (category === 'business') {
            interviewTypeSelect.value = 'business';
        } else if (category === 'healthcare') {
            interviewTypeSelect.value = 'healthcare';
        } else {
            interviewTypeSelect.value = 'behavioral';
        }
        
        openModal(interviewModal);
    }
    
    async function handleInterviewStart(e) {
        e.preventDefault();
        
        // Check if user is logged in
        if (!currentUser) {
            alert('Please log in to start an interview');
            closeModal(interviewModal);
            openModal(loginModal);
            return;
        }
        
        // Get form values
        const jobTitle = document.getElementById('jobTitle').value;
        const experienceLevel = document.getElementById('experienceLevel').value;
        const interviewType = document.getElementById('interviewType').value;
        const duration = document.getElementById('duration').value;
        
        // Set number of questions based on duration
        let numQuestions = 5;
        if (duration === 'medium') numQuestions = 10;
        if (duration === 'long') numQuestions = 15;
        
        // Store settings
        currentInterview.settings = {
            jobTitle,
            experienceLevel,
            interviewType,
            duration,
            numQuestions
        };
        
        try {
            // Fetch questions from server
            await fetchQuestions(interviewType, numQuestions);
            
            // Hide setup, show session
            interviewSetup.classList.add('hidden');
            interviewSession.classList.remove('hidden');
            
            // Display first question
            displayCurrentQuestion();
        } catch (error) {
            console.error('Error starting interview:', error);
            alert('Failed to load interview questions. Please try again.');
        }
    }
    
    async function fetchQuestions(type, numQuestions) {
        try {
            // Fetch questions from server
            const response = await fetch(`${API_URL}/questions/${type}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }
            
            const questions = await response.json();
            
            // If not enough questions in the database, use fallback
            if (questions.length < numQuestions) {
                generateFallbackQuestions(type, numQuestions);
                return;
            }
            
            // Shuffle and select questions
            const shuffled = [...questions].sort(() => 0.5 - Math.random());
            currentInterview.questions = shuffled.slice(0, numQuestions).map(q => q.text);
            
            // Initialize answers and feedback arrays
            currentInterview.answers = new Array(numQuestions).fill('');
            currentInterview.feedback = new Array(numQuestions).fill('');
            currentInterview.currentQuestionIndex = 0;
        } catch (error) {
            console.error('Error fetching questions:', error);
            // Fallback to local questions if API fails
            generateFallbackQuestions(type, numQuestions);
        }
    }
    
    function generateFallbackQuestions(type, numQuestions) {
        // Sample questions (fallback if server fails)
        const sampleQuestions = {
            technical: [
                "What is the difference between let, const, and var in JavaScript?",
                "Explain the concept of closures in JavaScript.",
                "How does the 'this' keyword work in JavaScript?",
                "What are promises in JavaScript and how do they work?",
                "Explain the difference between synchronous and asynchronous code.",
                "What is the event loop in JavaScript?",
                "Describe the difference between == and === in JavaScript.",
                "What is the DOM and how do you manipulate it?",
                "Explain RESTful API architecture.",
                "What is CORS and how does it work?"
            ],
            behavioral: [
                "Tell me about a time when you had to solve a complex problem.",
                "Describe a situation where you had to work under pressure to meet a deadline.",
                "Give an example of a time when you had to adapt to a significant change at work.",
                "Tell me about a time when you had a conflict with a team member and how you resolved it.",
                "Describe a project you're particularly proud of and your contribution to it.",
                "How do you handle criticism of your work?",
                "Tell me about a time when you failed at something and what you learned from it.",
                "How do you prioritize tasks when you have multiple deadlines?",
                "Describe a situation where you had to learn a new skill quickly.",
                "Tell me about a time when you went above and beyond what was required."
            ],
            business: [
                "How would you approach entering a new market?",
                "Describe how you would analyze the performance of a marketing campaign.",
                "How would you handle a situation where a client is unhappy with your service?",
                "What metrics would you use to measure the success of a product launch?",
                "How would you approach pricing a new product?",
                "Describe your approach to managing a team through a company restructuring.",
                "How would you handle a situation where you need to cut costs without affecting quality?",
                "What strategies would you use to increase customer retention?",
                "How would you approach a negotiation with a key supplier?",
                "Describe how you would create a five-year business plan."
            ],
            healthcare: [
                "How would you handle a situation where a patient is dissatisfied with their care?",
                "Describe your approach to maintaining patient confidentiality.",
                "How do you stay updated with the latest medical research and practices?",
                "Describe a situation where you had to make a quick decision in a patient's care.",
                "How would you handle a disagreement with a colleague about a patient's treatment plan?",
                "What steps would you take to prevent medication errors?",
                "How would you approach communicating bad news to a patient or their family?",
                "Describe your experience working in a multidisciplinary healthcare team.",
                "How do you manage your time effectively in a fast-paced healthcare environment?",
                "What strategies would you use to promote patient compliance with treatment plans?"
            ]
        };
        
        let questionPool = [];
        
        // Select question pool based on type
        if (type === 'technical') {
            questionPool = sampleQuestions.technical;
        } else if (type === 'behavioral') {
            questionPool = sampleQuestions.behavioral;
        } else if (type === 'business') {
            questionPool = sampleQuestions.business;
        } else if (type === 'healthcare') {
            questionPool = sampleQuestions.healthcare;
        } else {
            // Mixed - combine technical and behavioral
            questionPool = [...sampleQuestions.technical, ...sampleQuestions.behavioral];
        }
        
        // Shuffle and select questions
        const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
        currentInterview.questions = shuffled.slice(0, numQuestions);
        
        // Initialize answers and feedback arrays
        currentInterview.answers = new Array(numQuestions).fill('');
        currentInterview.feedback = new Array(numQuestions).fill('');
        currentInterview.currentQuestionIndex = 0;
    }
    
    function displayCurrentQuestion() {
        const index = currentInterview.currentQuestionIndex;
        const totalQuestions = currentInterview.questions.length;
        
        // Update question text
        document.getElementById('questionText').textContent = currentInterview.questions[index];
        
        // Update progress
        document.getElementById('currentQuestion').textContent = index + 1;
        document.getElementById('totalQuestions').textContent = totalQuestions;
        document.querySelector('.progress-fill').style.width = `${((index + 1) / totalQuestions) * 100}%`;
        
        // Reset answer input
        document.getElementById('answerInput').value = currentInterview.answers[index];
        
        // Hide feedback section
        document.getElementById('feedbackSection').classList.add('hidden');
        
        // Start timer
        startTimer();
    }
    
    function startTimer() {
        // Clear existing timer
        if (timer) clearInterval(timer);
        
        // Set time based on question complexity (2 minutes per question)
        timeLeft = 120;
        updateTimerDisplay();
        
        // Start interval
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                // Auto-submit when time runs out
                handleSubmitAnswer();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is running out
        if (timeLeft <= 30) {
            document.getElementById('timerDisplay').style.color = 'var(--danger-color)';
        } else {
            document.getElementById('timerDisplay').style.color = 'var(--text-light)';
        }
    }
    
    function handleSkipQuestion() {
        // Record empty answer
        const index = currentInterview.currentQuestionIndex;
        currentInterview.answers[index] = '';
        
        // Generate feedback for skipped question
        generateFeedback('', currentInterview.questions[index]);
    }
    
    function handleSubmitAnswer() {
        // Stop timer
        clearInterval(timer);
        
        // Get answer
        const answerInput = document.getElementById('answerInput');
        const answer = answerInput.value.trim();
        
        // Save answer
        const index = currentInterview.currentQuestionIndex;
        currentInterview.answers[index] = answer;
        
        // Generate feedback
        generateFeedback(answer, currentInterview.questions[index]);
    }
    
    async function generateFeedback(answer, question) {
        // In a real app, this would call an AI service via the server
        // For demo purposes, we'll generate simple feedback
        
        const index = currentInterview.currentQuestionIndex;
        let feedback = '';
        
        if (!answer) {
            feedback = `<p><strong>Question:</strong> ${question}</p>
                        <p><strong>Your Answer:</strong> <em>Skipped</em></p>
                        <p><strong>Feedback:</strong> You skipped this question. In a real interview, it's better to attempt an answer even if you're not completely confident. Try to provide at least a partial response or ask clarifying questions.</p>`;
        } else {
            // Simple feedback based on answer length
            const wordCount = answer.split(/\s+/).length;
            
            if (wordCount < 20) {
                feedback = `<p><strong>Question:</strong> ${question}</p>
                            <p><strong>Your Answer:</strong> ${answer}</p>
                            <p><strong>Feedback:</strong> Your answer is quite brief. Consider expanding on your points and providing specific examples to strengthen your response.</p>
                            <p><strong>Strengths:</strong> Concise and to the point.</p>
                            <p><strong>Areas for Improvement:</strong> Add more detail and examples to demonstrate your experience and skills.</p>`;
            } else if (wordCount < 50) {
                feedback = `<p><strong>Question:</strong> ${question}</p>
                            <p><strong>Your Answer:</strong> ${answer}</p>
                            <p><strong>Feedback:</strong> Good answer with some detail. You could further improve by structuring your response using the STAR method (Situation, Task, Action, Result) for behavioral questions.</p>
                            <p><strong>Strengths:</strong> Provided relevant information and some context.</p>
                            <p><strong>Areas for Improvement:</strong> Add more structure and be more specific about outcomes.</p>`;
            } else {
                feedback = `<p><strong>Question:</strong> ${question}</p>
                            <p><strong>Your Answer:</strong> ${answer}</p>
                            <p><strong>Feedback:</strong> Excellent detailed answer! You provided comprehensive information with good context and examples.</p>
                            <p><strong>Strengths:</strong> Well-structured response with specific examples and clear outcomes.</p>
                            <p><strong>Areas for Improvement:</strong> Consider practicing delivery to ensure you can communicate this effectively within time constraints.</p>`;
            }
        }
        
        // Save feedback
        currentInterview.feedback[index] = feedback;
        
        // Display feedback
        document.getElementById('feedbackContent').innerHTML = feedback;
        document.getElementById('feedbackSection').classList.remove('hidden');
    }
    
    function handleNextQuestion() {
        const index = currentInterview.currentQuestionIndex;
        const totalQuestions = currentInterview.questions.length;
        
        // Check if this was the last question
        if (index === totalQuestions - 1) {
            showResults();
        } else {
            // Move to next question
            currentInterview.currentQuestionIndex++;
            displayCurrentQuestion();
        }
    }
    
    function showResults() {
        // Hide interview session, show results
        interviewSession.classList.add('hidden');
        interviewResults.classList.remove('hidden');
        
        // Calculate scores
        const scores = calculateScores();
        
        // Update UI with scores
        document.getElementById('overallScore').textContent = scores.overall;
        
        // Update score bars
        const scoreItems = document.querySelectorAll('.score-item');
        scoreItems[0].querySelector('.score-fill').style.width = `${scores.content}%`;
        scoreItems[0].querySelector('span:last-child').textContent = `${scores.content}%`;
        
        scoreItems[1].querySelector('.score-fill').style.width = `${scores.relevance}%`;
        scoreItems[1].querySelector('span:last-child').textContent = `${scores.relevance}%`;
        
        scoreItems[2].querySelector('.score-fill').style.width = `${scores.structure}%`;
        scoreItems[2].querySelector('span:last-child').textContent = `${scores.structure}%`;
        
        // Generate detailed feedback
        generateDetailedFeedback();
    }
    
    function calculateScores() {
       
        
        // Count non-empty answers
        const answeredCount = currentInterview.answers.filter(a => a.trim() !== '').length;
        const totalQuestions = currentInterview.questions.length;
        
        // Base score on percentage of questions answered
        const completionRate = (answeredCount / totalQuestions) * 100;
        
        // Generate component scores
        const contentScore = Math.min(100, Math.round(completionRate + Math.random() * 20));
        const relevanceScore = Math.min(100, Math.round(completionRate + Math.random() * 15));
        const structureScore = Math.min(100, Math.round(completionRate + Math.random() * 10));
        
        // Calculate overall score
        const overallScore = Math.round((contentScore + relevanceScore + structureScore) / 3);
        
        return {
            overall: overallScore,
            content: contentScore,
            relevance: relevanceScore,
            structure: structureScore
        };
    }
    
    function generateDetailedFeedback() {
        // Generate summary feedback
        let detailedFeedback = '<div class="detailed-feedback">';
        
        // Overall summary
        detailedFeedback += `<div class="feedback-summary">
            <h5>Overall Assessment</h5>
            <p>You've demonstrated ${getPerformanceLevel()} interview skills. Here's a summary of your performance:</p>
            <ul>
                <li>You answered ${currentInterview.answers.filter(a => a.trim() !== '').length} out of ${currentInterview.questions.length} questions.</li>
                <li>Your responses showed ${getStrengthLevel()} in content and relevance.</li>
                <li>Your answer structure was ${getStructureLevel()}.</li>
            </ul>
            <p>Below are specific questions where you performed well and areas for improvement:</p>
        </div>`;
        
        // Strengths
        detailedFeedback += '<div class="feedback-strengths"><h5>Strengths</h5><ul>';
        
        // Find questions with longest answers
        const answerLengths = currentInterview.answers.map((answer, index) => ({
            index,
            length: answer.length,
            question: currentInterview.questions[index]
        }));
        
        const bestAnswers = answerLengths
            .filter(a => a.length > 0)
            .sort((a, b) => b.length - a.length)
            .slice(0, 2);
        
        if (bestAnswers.length > 0) {
            bestAnswers.forEach(answer => {
                detailedFeedback += `<li><strong>Q: ${answer.question}</strong> - You provided a comprehensive response with good detail.</li>`;
            });
        } else {
            detailedFeedback += '<li>No notable strengths identified. Try to provide more detailed responses in future practice sessions.</li>';
        }
        
        detailedFeedback += '</ul></div>';
        
        // Areas for improvement
        detailedFeedback += '<div class="feedback-improvements"><h5>Areas for Improvement</h5><ul>';
        
        // Find skipped or short answers
        const weakAnswers = answerLengths
            .filter(a => a.length === 0 || a.length < 50)
            .slice(0, 2);
        
        if (weakAnswers.length > 0) {
            weakAnswers.forEach(answer => {
                if (answer.length === 0) {
                    detailedFeedback += `<li><strong>Q: ${answer.question}</strong> - You skipped this question. Try to provide at least a partial answer in future interviews.</li>`;
                } else {
                    detailedFeedback += `<li><strong>Q: ${answer.question}</strong> - Your answer was brief. Consider expanding with specific examples and more detail.</li>`;
                }
            });
        } else {
            detailedFeedback += '<li>You provided answers to all questions with good detail. Focus on structuring your responses using frameworks like STAR for behavioral questions.</li>';
        }
        
        detailedFeedback += '</ul></div>';
        
        // Next steps
        detailedFeedback += `<div class="feedback-next-steps">
            <h5>Recommended Next Steps</h5>
            <ul>
                <li>Practice ${getRecommendedPracticeArea()} questions more frequently.</li>
                <li>Record yourself answering questions to review your delivery and body language.</li>
                <li>Study common questions for your target role and prepare structured responses.</li>
                <li>Schedule another practice session focusing on your weaker areas.</li>
            </ul>
        </div>`;
        
        detailedFeedback += '</div>';
        
        // Update UI
        document.getElementById('detailedFeedback').innerHTML = detailedFeedback;
    }
    
    function getPerformanceLevel() {
        const scores = calculateScores();
        if (scores.overall >= 85) return 'excellent';
        if (scores.overall >= 70) return 'good';
        if (scores.overall >= 50) return 'satisfactory';
        return 'developing';
    }
    
    function getStrengthLevel() {
        const scores = calculateScores();
        const avgContent = (scores.content + scores.relevance) / 2;
        if (avgContent >= 85) return 'exceptional strength';
        if (avgContent >= 70) return 'good strength';
        if (avgContent >= 50) return 'adequate strength';
        return 'room for improvement';
    }
    
    function getStructureLevel() {
        const scores = calculateScores();
        if (scores.structure >= 85) return 'well-structured and organized';
        if (scores.structure >= 70) return 'generally well-structured';
        if (scores.structure >= 50) return 'somewhat organized but could be improved';
        return 'in need of better organization';
    }
    
    function getRecommendedPracticeArea() {
        const interviewType = currentInterview.settings.interviewType;
        if (interviewType === 'technical') return 'technical';
        if (interviewType === 'behavioral') return 'behavioral';
        if (interviewType === 'business') return 'business case';
        if (interviewType === 'healthcare') return 'healthcare scenario';
        return 'mixed';
    }
    
    function resetInterview() {
        // Reset interview state
        currentInterview = {
            questions: [],
            answers: [],
            feedback: [],
            currentQuestionIndex: 0,
            settings: {}
        };
        
        // Reset UI
        interviewResults.classList.add('hidden');
        interviewSession.classList.add('hidden');
        interviewSetup.classList.remove('hidden');
        
        // Clear timer
        if (timer) clearInterval(timer);
    }
    
    async function saveInterviewResults() {
        // Check if user is logged in
        if (!currentUser) {
            alert('Please log in to save your results');
            return;
        }
        
        try {
            // Calculate scores
            const scores = calculateScores();
            
            // Prepare data for saving
            const interviewData = {
                userId: currentUser._id,
                questions: currentInterview.questions,
                answers: currentInterview.answers,
                feedback: currentInterview.feedback,
                settings: currentInterview.settings,
                scores: scores
            };
            
            // Send to server
            const response = await fetch(`${API_URL}/interviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(interviewData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save interview results');
            }
            
            const data = await response.json();
            
            alert('Interview results saved successfully!');
        } catch (error) {
            console.error('Error saving interview results:', error);
            alert('Failed to save interview results. Please try again.');
        }
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            // Send login request to server
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
            
            const data = await response.json();
            
            // Save user data
            currentUser = data.user;
            
            // Store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal
            closeModal(loginModal);
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login failed. Please check your credentials and try again.');
        }
    }
    
    async function handleSignup(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        try {
            // Send signup request to server
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }
            
            const data = await response.json();
            
            // Save user data
            currentUser = data.user;
            
            // Store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserUI();
            
            // Close modal
            closeModal(signupModal);
            
            alert('Account created successfully!');
        } catch (error) {
            console.error('Signup error:', error);
            alert(error.message || 'Registration failed. Please try again.');
        }
    }
    
    function handleLogout() {
        // Clear current user
        currentUser = null;
        
        // Remove from localStorage
        localStorage.removeItem('currentUser');
        
        // Update UI
        updateUserUI();
    }
    
    function updateUserUI() {
        if (currentUser) {
            // Show user profile, hide auth buttons
            userProfile.classList.remove('hidden');
            authButtons.classList.add('hidden');
            
            // Update profile info
            userProfile.querySelector('img').src = currentUser.profileImage || 'https://randomuser.me/api/portraits/men/1.jpg';
            userProfile.querySelector('span').textContent = currentUser.name;
        } else {
            // Hide user profile, show auth buttons
            userProfile.classList.add('hidden');
            authButtons.classList.remove('hidden');
        }
    }
});