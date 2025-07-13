const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env file

const configurePassport = require('./config/passport');
const { isAuthenticated, isAdmin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { sharedLinks } = require('./utils/share');

const app = express();
const port = 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Configure Passport
configurePassport();

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey', // Use environment variable, fallback for development
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// Serve specific public files that don't require authentication
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/pending.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pending.html'));
});

app.get('/forbidden.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forbidden.html'));
});

// Authentication routes
app.use('/auth', authRoutes);

// Protect all other routes
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use('/uploads', isAuthenticated, express.static('uploads'));

// API routes
app.use('/api', isAuthenticated, apiRoutes);

app.get('/shared/:shareId/:filename', isAuthenticated, (req, res) => {
    const { shareId, filename } = req.params;
    const sharedItem = sharedLinks[shareId];

    if (!sharedItem) {
        return res.status(404).send('Shared link not found or expired.');
    }

    if (sharedItem.isDirectory) {
        // For directories, redirect to the main app with the path pre-filled
        const relativePath = path.relative(uploadsDir, sharedItem.fullPath);
        return res.redirect(`/?path=${encodeURIComponent(relativePath)}`);
    } else {
        // For files, serve the file directly
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.sendFile(sharedItem.fullPath);
    }
});

// Serve any other static files from public directory (e.g., CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
