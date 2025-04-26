document.addEventListener('DOMContentLoaded', () => {
    const historyContainer = document.getElementById('history-container');
    const filterForm = document.getElementById('filter-form');
    const typeFilter = document.getElementById('type-filter');
    const dateFilter = document.getElementById('date-filter');
    const progressChartCanvas = document.getElementById('progress-chart');
    const statsContainer = document.getElementById('stats-container');

    let allInterviews = []; 

    // --- User Authentication ---

    let userId;
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        userId = user?._id || '67ff885d8c0eb7e72e11587c'; 
    } catch (error) {
        console.log('Error retrieving user from localStorage, using fallback ID');
        userId = '67ff885d8c0eb7e72e11587c'; 
    }
    
    if (!userId) {
        historyContainer.innerHTML = '<p>Please log in to view your history.</p>';
        // Optionally hide filters and chart if not logged in
        filterForm.style.display = 'none';
        if (progressChartCanvas) progressChartCanvas.parentElement.parentElement.style.display = 'none';
        if (statsContainer) statsContainer.style.display = 'none';
        return;
    }

    // --- Fetch and Display Initial Data ---
    fetchInterviews(userId);

    // --- Event Listeners ---
    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        applyFilters();
    });

    // --- Functions ---

    async function fetchInterviews(currentUserId, filters = {}) {
        // Construct the API endpoint URL
        let apiUrl = `/api/interviews/user/${currentUserId}`;

        // Add filter query parameters if they exist
        const queryParams = new URLSearchParams();
        if (filters.type) {
            queryParams.append('type', filters.type);
        }
        if (filters.date) {
            // Ensure date is in YYYY-MM-DD format if needed by backend
            queryParams.append('date', filters.date);
        }

        if (queryParams.toString()) {
            apiUrl += `?${queryParams.toString()}`;
        }


        try {
            console.log(`Fetching interviews from: ${apiUrl}`); // Debugging
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const interviews = await response.json();
            console.log('Fetched interviews:', interviews); // Debugging

            // Store all interviews if it's the initial fetch
            if (Object.keys(filters).length === 0) {
                allInterviews = interviews;
            }

            displayInterviews(interviews);
            updateStats(interviews);
            updateChart(interviews); // Uncommented to enable chart

        } catch (error) {
            console.error('Error fetching interview history:', error);
            historyContainer.innerHTML = '<p class="text-danger">Error loading interview history. Please try again later.</p>';
        }
    }

    function displayInterviews(interviews) {
        historyContainer.innerHTML = ''; // Clear previous results

        if (!interviews || interviews.length === 0) {
            historyContainer.innerHTML = '<p>No interview history found.</p>';
            return;
        }

        interviews.forEach(interview => {
            const card = document.createElement('div');
            card.className = 'card mb-3 history-item'; // Added history-item class

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const title = document.createElement('h5');
            title.className = 'card-title';
            // TODO: Determine a better title, maybe based on settings or date
            const interviewType = interview.settings?.type || 'General'; // Extract type from settings if available
            const interviewDate = new Date(interview.createdAt).toLocaleDateString();
            title.textContent = `${interviewType} Interview - ${interviewDate}`;

            const details = document.createElement('p');
            details.className = 'card-text';
            // TODO: Display more relevant details (e.g., overall score)
            const overallScore = calculateOverallScore(interview.scores); // Calculate score if available
            details.innerHTML = `
                Questions: ${interview.questions?.length || 0}<br>
                ${overallScore !== null ? `Overall Score: ${overallScore}%<br>` : ''}
                Date: ${new Date(interview.createdAt).toLocaleString()}
            `;

            const viewDetailsButton = document.createElement('a');
            viewDetailsButton.href = `#`; // Or link to a detailed view page: `view-interview.html?id=${interview._id}`
            viewDetailsButton.className = 'btn btn-sm btn-outline-primary';
            viewDetailsButton.textContent = 'View Details';
            // Optional: Add event listener for viewing details
            viewDetailsButton.addEventListener('click', (e) => {
                e.preventDefault();
                // TODO: Implement detailed view logic (e.g., show modal, navigate)
                alert(`Viewing details for interview ID: ${interview._id}`);
                console.log(interview); // Log full interview data for inspection
            });


            cardBody.appendChild(title);
            cardBody.appendChild(details);
            cardBody.appendChild(viewDetailsButton);
            card.appendChild(cardBody);
            historyContainer.appendChild(card);
        });
    }

    function applyFilters() {
        const selectedType = typeFilter.value;
        const selectedDate = dateFilter.value; // Value is already YYYY-MM-DD

        console.log(`Applying filters - Type: ${selectedType}, Date: ${selectedDate}`); 

        const filteredInterviews = allInterviews.filter(interview => {
            const interviewDate = interview.createdAt.split('T')[0]; // Get YYYY-MM-DD part of ISO string
            const typeMatch = !selectedType || (interview.settings?.type?.toLowerCase() === selectedType.toLowerCase());
            const dateMatch = !selectedDate || (interviewDate === selectedDate);
            return typeMatch && dateMatch;
        });

        displayInterviews(filteredInterviews);
        updateStats(filteredInterviews);
        updateChart(filteredInterviews);
    }

    function updateStats(interviews) {
        if (!statsContainer) return;

        const totalInterviews = interviews.length;
        const avgScore = calculateAverageScore(interviews);
        // Add more stats as needed (e.g., counts by type)

        statsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="stat-card">
                        <h6>Total Interviews</h6>
                        <p>${totalInterviews}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-card">
                        <h6>Average Score</h6>
                        <p>${avgScore !== null ? avgScore.toFixed(1) + '%' : 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    function calculateOverallScore(scores) {
        // TODO: Adapt this based on the actual structure of 'scores'
        if (!scores || typeof scores !== 'object') return null;

        // Example: Assume scores is { clarity: 80, relevance: 75, confidence: 90 }
        const scoreValues = Object.values(scores).filter(s => typeof s === 'number');
        if (scoreValues.length === 0) return null;

        const sum = scoreValues.reduce((acc, score) => acc + score, 0);
        return (sum / scoreValues.length); // Return average score
    }

    function calculateAverageScore(interviews) {
        const validScores = interviews
            .map(interview => calculateOverallScore(interview.scores))
            .filter(score => score !== null);

        if (validScores.length === 0) return null;

        const sum = validScores.reduce((acc, score) => acc + score, 0);
        return sum / validScores.length;
    }

    // --- Chart Logic ---
    function updateChart(interviews) {
        if (!progressChartCanvas) return;
        
        // Set minimum size for the chart container
        const chartContainer = progressChartCanvas.parentElement;
        chartContainer.style.minWidth = '300px';
        chartContainer.style.minHeight = '300px';
        
        const ctx = progressChartCanvas.getContext('2d');

        // Sort interviews by date (oldest to newest)
        const sortedInterviews = [...interviews].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        // Extract data for chart (scores over time)
        const labels = sortedInterviews.map(i => new Date(i.createdAt).toLocaleDateString());
        const dataPoints = sortedInterviews.map(i => calculateOverallScore(i.scores) || 0);

        // Destroy previous chart instance if exists
        if (window.myProgressChart instanceof Chart) {
            window.myProgressChart.destroy();
        }

        // Create new chart
        window.myProgressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Interview Score',
                    data: dataPoints,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: 'rgb(75, 192, 192)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Score (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Interview Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Score: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

});
