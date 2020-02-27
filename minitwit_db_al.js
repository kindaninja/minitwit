const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres'/* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
});
