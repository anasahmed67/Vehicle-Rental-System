const db = require('./database');
const bcrypt = require('bcrypt');

bcrypt.hash('adminpass', 10, (err, adminHash) => {
    if (err) {
        console.error('Error hashing admin password:', err);
        return;
    }
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', adminHash, 'admin'], (err) => {
        if (err) {
            console.error('Error inserting admin user:', err);
        } else {
            console.log('Admin user inserted successfully');
        }
    });
});

bcrypt.hash('userpass', 10, (err, userHash) => {
    if (err) {
        console.error('Error hashing user password:', err);
        return;
    }
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['user', userHash, 'user'], (err) => {
        if (err) {
            console.error('Error inserting user:', err);
        } else {
            console.log('User inserted successfully');
        }
    });
});
