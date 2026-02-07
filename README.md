# Vehicle Rental System

A Node.js web application for managing a vehicle rental system. This app allows you to manage vehicles, customers, employees, rentals, and payments using a SQLite database.

## Prerequisites

- Node.js (version 14 or higher) installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

## Installation

1. Clone or download this repository to your local machine.
2. Navigate to the project directory:
   ```
   cd c:/Users/user/Desktop/DBMS Project
   ```
3. Install the required dependencies:
   ```
   npm install
   ```

## Running the App

1. Start the application by running the following command:
   ```
   node vehicle-rental-nodejs/app.js
   ```
2. Open your web browser and go to `http://localhost:3000` to access the application.

The server will start and display a message indicating that the app is listening on port 3000.

## Usage

The application provides a web interface to manage:

- **Vehicles**: Add, view, edit, and delete vehicles in the system.
- **Customers**: Manage customer information including name, email, and phone.
- **Employees**: Add and manage employees with their roles.
- **Rentals**: Create and manage rental records, including start and end dates, and return functionality.
- **Payments**: Record and track payments associated with rentals.

Navigate through the different sections using the menu on the homepage.

## Database

The application uses SQLite as the database. The database file `vehicle_rental.db` is included in the `vehicle-rental-nodejs/` directory. It contains tables for vehicles, customers, employees, rentals, and payments.

## Technologies Used

- Node.js
- Express.js
- SQLite3
- EJS (Embedded JavaScript templates)
- Body-parser

## License

This project is licensed under the ISC License.
