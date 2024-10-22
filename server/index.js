require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // bcrypt for hashing
const jwt = require('jsonwebtoken'); // JWT for authentication
const cors = require("cors");
const EmployeeModel = require('./models/Employee');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 3000;  
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret key from env

// User Registration with Password Hashing
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Check if the user already exists
    const existingUser = await EmployeeModel.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    try {
        const newUser = await EmployeeModel.create({ name, email, password: hashedPassword });
        res.json(newUser);
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

// User Login with JWT Token Generation
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    const user = await EmployeeModel.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: "No user found with this email" });
    }

    // Compare the password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: "Login successful", token });
});

mongoose
.connect(MONGO_URL)
.then(() => {
    app.listen(PORT, () => {
        console.log(`Node API app is running on ${PORT}`);
    });
    console.log('Connected to MongoDB');
})
.catch(() => {
    console.log("Database connection error");
});
