const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./database');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '..')));

// Session configuration
app.use(session({
    secret: 'your-secret-key', // Change this to a secure secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
}

function requireAdmin(req, res, next) {
    if (req.session.userId && req.session.role === 'admin') {
        return next();
    } else {
        res.status(403).send('Access denied');
    }
}

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Dashboard redirect route
app.get('/dashboard', (req, res) => {
    if (req.session.userId) {
        if (req.session.role === 'admin') {
            res.redirect('/admin_dashboard');
        } else {
            res.redirect('/user_dashboard');
        }
    } else {
        res.redirect('/login');
    }
});

// Login routes
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).send('Error retrieving user');
        }
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).send('Error comparing passwords');
            }
            if (result) {
                req.session.userId = user.id;
                req.session.role = user.role;
                if (user.role === 'admin') {
                    res.redirect('/admin_dashboard');
                } else {
                    res.redirect('/user_dashboard');
                }
            } else {
                res.render('login', { error: 'Invalid username or password' });
            }
        });
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
});

// Admin dashboard
app.get('/admin_dashboard', requireAdmin, (req, res) => {
    // Fetch summary counts and revenue
    const queries = [
        'SELECT COUNT(*) as count FROM vehicles',
        'SELECT COUNT(*) as count FROM customers',
        'SELECT COUNT(*) as count FROM employees',
        'SELECT COUNT(*) as count FROM rentals',
        'SELECT COUNT(*) as count FROM payments'
    ];

    const summary = {};
    let completed = 0;

    queries.forEach((query, index) => {
        const key = ['vehicles', 'customers', 'employees', 'rentals', 'payments'][index];
        db.get(query, [], (err, row) => {
            if (err) {
                console.error(`Error fetching ${key}:`, err);
                summary[key] = 0;
            } else {
                summary[key] = row.count;
            }
            completed++;
            if (completed === queries.length) {
                res.render('admin_dashboard', { summary, role: req.session.role });
            }
        });
    });
});

// User dashboard
app.get('/user_dashboard', requireAuth, (req, res) => {
    res.render('user_dashboard');
});

app.get('/vehicles', requireAuth, (req, res) => {
    db.all('SELECT * FROM vehicles', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving vehicles');
        }
        res.render('vehicles', { vehicles: rows, user: req.session.role });
    });
});

app.get('/add_vehicle', requireAdmin, (req, res) => {
    res.render('add_vehicle');
});

app.post('/add_vehicle', requireAdmin, (req, res) => {
    const { make, model, year, type } = req.body;
    db.run('INSERT INTO vehicles (make, model, year, type) VALUES (?, ?, ?, ?)', [make, model, year, type], (err) => {
        if (err) {
            return res.status(500).send('Error adding vehicle');
        }
        res.redirect('/vehicles');
    });
});

app.get('/edit_vehicle/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM vehicles WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).send('Error retrieving vehicle');
        }
        res.render('edit_vehicle', { vehicle: row });
    });
});

app.post('/edit_vehicle/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { make, model, year, type } = req.body;
    db.run('UPDATE vehicles SET make = ?, model = ?, year = ?, type = ? WHERE id = ?', [make, model, year, type, id], (err) => {
        if (err) {
            return res.status(500).send('Error updating vehicle');
        }
        res.redirect('/vehicles');
    });
});

app.post('/delete_vehicle/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM vehicles WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Error deleting vehicle');
        }
        res.redirect('/vehicles');
    });
});

app.get('/customers', requireAuth, (req, res) => {
    db.all('SELECT * FROM customers', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving customers');
        }
        res.render('customers', { customers: rows, user: req.session.role });
    });
});

app.get('/add_customer', requireAuth, (req, res) => {
    res.render('add_customer');
});

app.post('/add_customer', requireAuth, (req, res) => {
    const { name, email, phone } = req.body;
    db.run('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [name, email, phone], (err) => {
        if (err) {
            return res.status(500).send('Error adding customer');
        }
        res.redirect('/customers');
    });
});

app.get('/edit_customer/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).send('Error retrieving customer');
        }
        res.render('edit_customer', { customer: row });
    });
});

app.post('/edit_customer/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { name, email, phone } = req.body;
    db.run('UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, id], (err) => {
        if (err) {
            return res.status(500).send('Error updating customer');
        }
        res.redirect('/customers');
    });
});

app.post('/delete_customer/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM customers WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Error deleting customer');
        }
        res.redirect('/customers');
    });
});

app.get('/employees', requireAdmin, (req, res) => {
    db.all('SELECT * FROM employees', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving employees');
        }
        res.render('employees', { employees: rows });
    });
});

app.get('/add_employee', requireAdmin, (req, res) => {
    res.render('add_employee');
});

app.post('/add_employee', requireAdmin, (req, res) => {
    const { name, role } = req.body;
    db.run('INSERT INTO employees (name, role) VALUES (?, ?)', [name, role], (err) => {
        if (err) {
            return res.status(500).send('Error adding employee');
        }
        res.redirect('/employees');
    });
});

app.get('/edit_employee/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).send('Error retrieving employee');
        }
        res.render('edit_employee', { employee: row });
    });
});

app.post('/edit_employee/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { name, role } = req.body;
    db.run('UPDATE employees SET name = ?, role = ? WHERE id = ?', [name, role, id], (err) => {
        if (err) {
            return res.status(500).send('Error updating employee');
        }
        res.redirect('/employees');
    });
});

app.post('/delete_employee/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM employees WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Error deleting employee');
        }
        res.redirect('/employees');
    });
});

app.get('/rentals', requireAuth, (req, res) => {
    const query = `
        SELECT rentals.*, customers.name as customer_name, vehicles.make, vehicles.model
        FROM rentals
        JOIN customers ON rentals.customer_id = customers.id
        JOIN vehicles ON rentals.vehicle_id = vehicles.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving rentals');
        }
        res.render('rentals', { rentals: rows, user: req.session.role });
    });
});

app.get('/add_rental', requireAuth, (req, res) => {
    db.all('SELECT * FROM customers', [], (err, customers) => {
        if (err) {
            return res.status(500).send('Error retrieving customers');
        }
        db.all('SELECT * FROM vehicles WHERE status = "available"', [], (err, vehicles) => {
            if (err) {
                return res.status(500).send('Error retrieving vehicles');
            }
            res.render('add_rental', { customers, vehicles });
        });
    });
});

app.post('/add_rental', requireAuth, (req, res) => {
    const { customer_id, vehicle_id, start_date, end_date } = req.body;
    db.run('INSERT INTO rentals (customer_id, vehicle_id, start_date, end_date) VALUES (?, ?, ?, ?)', [customer_id, vehicle_id, start_date, end_date], function(err) {
        if (err) {
            return res.status(500).send('Error adding rental');
        }
        db.run('UPDATE vehicles SET status = "rented" WHERE id = ?', [vehicle_id], (err) => {
            if (err) {
                return res.status(500).send('Error updating vehicle status');
            }
            res.redirect('/rentals');
        });
    });
});

app.post('/return_rental/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    db.run('UPDATE rentals SET status = "returned" WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Error returning rental');
        }
        db.get('SELECT vehicle_id FROM rentals WHERE id = ?', [id], (err, row) => {
            if (err) {
                return res.status(500).send('Error retrieving rental');
            }
            db.run('UPDATE vehicles SET status = "available" WHERE id = ?', [row.vehicle_id], (err) => {
                if (err) {
                    return res.status(500).send('Error updating vehicle status');
                }
                res.redirect('/rentals');
            });
        });
    });
});

app.get('/edit_rental/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM rentals WHERE id = ?', [id], (err, rental) => {
        if (err) {
            return res.status(500).send('Error retrieving rental');
        }
        db.all('SELECT * FROM customers', [], (err, customers) => {
            if (err) {
                return res.status(500).send('Error retrieving customers');
            }
            db.all('SELECT * FROM vehicles', [], (err, vehicles) => {
                if (err) {
                    return res.status(500).send('Error retrieving vehicles');
                }
                res.render('edit_rental', { rental, customers, vehicles });
            });
        });
    });
});

app.post('/edit_rental/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { customer_id, vehicle_id, start_date, end_date } = req.body;
    db.run('UPDATE rentals SET customer_id = ?, vehicle_id = ?, start_date = ?, end_date = ? WHERE id = ?', [customer_id, vehicle_id, start_date, end_date, id], (err) => {
        if (err) {
            return res.status(500).send('Error updating rental');
        }
        res.redirect('/rentals');
    });
});

app.post('/delete_rental/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM rentals WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Error deleting rental');
        }
        res.redirect('/rentals');
    });
});

app.get('/payments', requireAuth, (req, res) => {
    const query = `
        SELECT payments.*, rentals.id as rental_id, customers.name as customer_name
        FROM payments
        JOIN rentals ON payments.rental_id = rentals.id
        JOIN customers ON rentals.customer_id = customers.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving payments');
        }
        res.render('payments', { payments: rows, user: req.session.role });
    });
});

app.get('/add_payment', requireAuth, (req, res) => {
    const query = 'SELECT rentals.id, customers.name FROM rentals JOIN customers ON rentals.customer_id = customers.id';
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving rentals');
        }
        res.render('add_payment', { rentals: rows });
    });
});

app.post('/add_payment', requireAuth, (req, res) => {
    const { rental_id, amount } = req.body;
    const date = new Date().toISOString().split('T')[0];
    db.run('INSERT INTO payments (rental_id, amount, date) VALUES (?, ?, ?)', [rental_id, amount, date], (err) => {
        if (err) {
            return res.status(500).send('Error adding payment');
        }
        res.redirect('/payments');
    });
});

app.get('/edit_payment/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM payments WHERE id = ?', [id], (err, payment) => {
        if (err) {
            return res.status(500).send('Error retrieving payment');
        }
        const query = 'SELECT rentals.id, customers.name FROM rentals JOIN customers ON rentals.customer_id = customers.id';
        db.all(query, [], (err, rentals) => {
            if (err) {
                return res.status(500).send('Error retrieving rentals');
            }
            res.render('edit_payment', { payment, rentals });
        });
    });
});

app.post('/edit_payment/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { rental_id, amount } = req.body;
    db.run('UPDATE payments SET rental_id = ?, amount = ? WHERE id = ?', [rental_id, amount, id], (err) => {
        if (err) {
            return res.status(500).send('Error updating payment');
        }
        res.redirect('/payments');
    });
});

app.post('/delete_payment/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM payments WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).send('Error deleting payment');
        }
        res.redirect('/payments');
    });
});

// Download report route
app.get('/download_report', requireAdmin, (req, res) => {
    const query = `
        SELECT rentals.id, customers.name as customer_name, customers.email, customers.phone,
               vehicles.make, vehicles.model, vehicles.year, vehicles.type,
               rentals.start_date, rentals.end_date, rentals.status
        FROM rentals
        JOIN customers ON rentals.customer_id = customers.id
        JOIN vehicles ON rentals.vehicle_id = vehicles.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving rental data');
        }
        const csvWriter = createCsvWriter({
            path: 'rental_report.csv',
            header: [
                { id: 'id', title: 'Rental ID' },
                { id: 'customer_name', title: 'Customer Name' },
                { id: 'email', title: 'Customer Email' },
                { id: 'phone', title: 'Customer Phone' },
                { id: 'make', title: 'Vehicle Make' },
                { id: 'model', title: 'Vehicle Model' },
                { id: 'year', title: 'Vehicle Year' },
                { id: 'type', title: 'Vehicle Type' },
                { id: 'start_date', title: 'Start Date' },
                { id: 'end_date', title: 'End Date' },
                { id: 'status', title: 'Status' }
            ]
        });
        csvWriter.writeRecords(rows).then(() => {
            res.download('rental_report.csv', 'rental_report.csv', (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                }
                // Optionally delete the file after download
                const fs = require('fs');
                fs.unlink('rental_report.csv', (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }).catch((err) => {
            console.error('Error writing CSV:', err);
            res.status(500).send('Error generating report');
        });
    });
});

app.listen(port, () => {
    console.log(`Vehicle Rental System app listening at http://localhost:${port}`);
});
