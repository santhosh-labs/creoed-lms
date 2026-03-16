const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL / phpMyAdmin Database connected successfully');
        connection.release();
    } catch (err) {
        console.error('MySQL Connection Failed:', err.message);
        console.log('Ensure XAMPP MySQL is running and you have created a database named "creoedlms" in phpMyAdmin.');
    }
};

module.exports = { pool, connectDB };
