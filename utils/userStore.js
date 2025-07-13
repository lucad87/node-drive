const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

let users = [];

// Load users from file on startup
try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    users = JSON.parse(data);
} catch (err) {
    console.error('Error loading users.json:', err.message);
    users = [];
}

function saveUsers() {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
}

function findUserById(id) {
    return users.find(user => user.id === id);
}

function findUserByGoogleId(googleId) {
    return users.find(user => user.googleId === googleId);
}

function addUser(user) {
    users.push(user);
    saveUsers();
}

function updateUser(updatedUser) {
    const index = users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
        users[index] = updatedUser;
        saveUsers();
    }
}

function deleteUser(id) {
    users = users.filter(user => user.id !== id);
    saveUsers();
}

function getAllUsers() {
    return users;
}

module.exports = {
    findUserById,
    findUserByGoogleId,
    addUser,
    updateUser,
    deleteUser,
    getAllUsers
};