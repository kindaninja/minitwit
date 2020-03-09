'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Messages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      message_id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      text: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pub_date: {
        type: Sequelize.DATE
      },
      flagged: {
        type: Sequelize.INTEGER
      },
      createdAt: {

        type: Sequelize.DATE,
      },
      updatedAt: {

        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Messages');
  }
};