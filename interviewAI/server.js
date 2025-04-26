const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/Brijesh";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

var db;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        db = client.db("Brijesh");
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

// API Routes

// User Routes
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(newUser);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword,
            userId: result.insertedId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




// Interview Routes
app.post('/api/interviews', async (req, res) => {
    try {
        const { userId, questions, answers, feedback, settings, scores } = req.body;
        
        // Create new interview record
        const newInterview = {
            userId: new ObjectId(userId),
            questions,
            answers,
            feedback,
            settings,
            scores,
            createdAt: new Date()
        };
        
        const result = await db.collection('interviews').insertOne(newInterview);
        
        res.status(201).json({
            message: 'Interview saved successfully',
            interviewId: result.insertedId
        });
    } catch (error) {
        console.error('Save interview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/interviews/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Get user's interviews
        const interviews = await db.collection('interviews')
            .find({ userId: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .toArray();
        
        res.json(interviews);
    } catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/interviews/:id', async (req, res) => {
    try {
        const interviewId = req.params.id;
        
        // Get interview by ID
        const interview = await db.collection('interviews').findOne({ _id: new ObjectId(interviewId) });
        
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }
        
        res.json(interview);
    } catch (error) {
        console.error('Get interview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Questions Routes
app.get('/api/questions/:category', async (req, res) => {
    try {
        const category = req.params.category;
        
        // Get questions by category
        const questions = await db.collection('questions')
            .find({ category })
            .toArray();
        
        res.json(questions);
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Serve the main HTML file for all routes (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});





// Start server
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}






startServer();

// Handle server shutdown
process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});