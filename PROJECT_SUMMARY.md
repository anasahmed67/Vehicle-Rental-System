# Vehicle Rental Management System - Project Summary

## Overview
This project is a comprehensive web-based Vehicle Rental Management System built using Node.js and Express.js. It provides a user-friendly interface for managing various aspects of a vehicle rental business, including vehicles, customers, employees, rentals, and payments. The application supports role-based authentication (admin and regular users) and includes features for CRUD operations, rental tracking, payment processing, and report generation.

## Key Features
- **User Authentication**: Secure login system with bcrypt password hashing and session management. Supports admin and user roles with different access levels.
- **Vehicle Management**: Add, view, edit, and delete vehicles. Tracks vehicle details like make, model, year, and type, along with availability status.
- **Customer Management**: Manage customer information including name, email, and phone number.
- **Employee Management**: Admin-only feature to add and manage employees with their roles.
- **Rental Management**: Create rental records linking customers to vehicles with start/end dates. Includes functionality to mark rentals as returned and update vehicle status accordingly.
- **Payment Tracking**: Record payments associated with rentals, with automatic date stamping.
- **Dashboard**: Role-specific dashboards displaying summary statistics (counts of vehicles, customers, etc.) for admins.
- **Report Generation**: Download rental reports in CSV format, including customer and vehicle details.
- **Responsive UI**: Uses EJS templating for dynamic web pages with static assets.

## Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 for lightweight, file-based database storage
- **Frontend**: EJS (Embedded JavaScript templates) for server-side rendering
- **Security**: bcrypt for password hashing, express-session for session management
- **Utilities**: body-parser for request parsing, csv-writer for report generation
- **Other Dependencies**: express-static for serving static files

## Project Structure
- `package.json`: Defines project metadata, scripts, and dependencies.
- `vehicle-app/app.js`: Main application file containing Express server setup, routes, middleware, and business logic.
- `vehicle-app/database.js`: Database connection and setup (assumed based on import in app.js).
- `vehicle-app/views/`: Directory containing EJS templates for various pages (e.g., login, dashboards, CRUD forms).
- `vehicle_rental.db`: SQLite database file with tables for users, vehicles, customers, employees, rentals, and payments.
- `README.md`: Installation and usage instructions.

## Database Schema
The SQLite database includes the following tables:
- `users`: For authentication (username, password hash, role).
- `vehicles`: Vehicle details and status.
- `customers`: Customer contact information.
- `employees`: Employee details.
- `rentals`: Rental records linking customers and vehicles with dates and status.
- `payments`: Payment records linked to rentals.

## Installation and Running
1. Clone or download the repository.
2. Navigate to the project directory and run `npm install` to install dependencies.
3. Start the server with `node vehicle-app/app.js`.
4. Access the application at `http://localhost:3000`.

## Usage
- Log in as admin or user.
- Navigate through menus to manage entities.
- Admins have full CRUD access; users have limited access.
- Generate and download reports from the admin dashboard.

## License
Licensed under the ISC License.

This summary provides an overview of the project's purpose, features, and technical details based on the codebase analysis.
