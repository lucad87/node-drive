const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userStore = require('../utils/userStore');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
    },
    function(accessToken, refreshToken, profile, cb) {
        let user = userStore.findUserByGoogleId(profile.id);
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!user) {
            // New user, add to store with default permissions
            user = {
                id: profile.id, // Using Google ID as our internal ID for simplicity
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails && profile.emails[0] ? profile.emails[0].value : '',
                isAdmin: (profile.emails && profile.emails[0] && profile.emails[0].value === adminEmail), // Set admin if email matches ADMIN_EMAIL
                canAccess: (profile.emails && profile.emails[0] && profile.emails[0].value === adminEmail) // Set canAccess if email matches ADMIN_EMAIL
            };
            userStore.addUser(user);
        } else {
            // Update existing user's display name and email if they changed
            user.displayName = profile.displayName;
            user.email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            // Only update isAdmin/canAccess if they are currently false and email matches adminEmail
            if (!user.isAdmin && user.email === adminEmail) {
                user.isAdmin = true;
                user.canAccess = true;
            }
            userStore.updateUser(user);
        }
        return cb(null, user);
    }));

    passport.serializeUser(function(user, cb) {
        cb(null, user.id);
    });

    passport.deserializeUser(function(id, cb) {
        const user = userStore.findUserById(id);
        cb(null, user);
    });
};