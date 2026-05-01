const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL || process.env.MYSQL_URI, {
  dialect: 'mysql',
  logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize;
