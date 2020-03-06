'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    message_id: Sequelize.DataTypes.INTEGER,
    author_id: Sequelize.DataTypes.INTEGER,
    text: Sequelize.DataTypes.STRING,
    pub_date: Sequelize.DataTypes.INTEGER,
    flagged: Sequelize.DataTypes.INTEGER,
    createdAt: Sequelize.DataTypes.DATE,
    updatedAt: Sequelize.DataTypes.DATE,
  }, {});
  Message.associate = function (models) {
    Message.belongsTo(models.User, {
      foreignKey: 'author_id',
    })
  };
  return Message;
};
