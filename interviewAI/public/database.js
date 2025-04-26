const mongoose  = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB Connection
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/Brijesh";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



async function initializeDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        
        const db = client.db("interviewAI");
        
        // Create collections if they don't exist
        await db.createCollection("users");
        await db.createCollection("interviews");
        await db.createCollection("questions");
        
        console.log("Collections created");
        
        // Check if questions collection is empty
        const questionCount = await db.collection("questions").countDocuments();401
        
        if (questionCount === 0) {
            console.log("Populating questions collection...");
            
            // Flatten the questions array
            const allQuestions = [
                ...sampleQuestions.technical,
                ...sampleQuestions.behavioral,
                ...sampleQuestions.business,
                ...sampleQuestions.healthcare
            ];
            
            // Insert questions
            await db.collection("questions").insertMany(allQuestions);
            console.log(`${allQuestions.length} questions inserted`);
        } else {
            console.log("Questions collection already populated");
        }
        
        // Create a sample user if none exists
        const userCount = await db.collection("users").countDocuments();
        
        if (userCount === 0) {
            console.log("Creating sample user...");
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("password123", salt);
            
            // Create sample user
            const sampleUser = {
                name: "John Doe",
                email: "john@example.com",
                password: hashedPassword,
                createdAt: new Date()
            };
            
            await db.collection("users").insertOne(sampleUser);
            console.log("Sample user created");
        } else {
            console.log("Users collection already has data");
        }
        
        console.log("Database initialization complete");
    } catch (error) {
        console.error("Error initializing database:", error);
    } finally {
        await client.close();
        console.log("MongoDB connection closed");
    }
}

// Run the initialization
initializeDatabase();