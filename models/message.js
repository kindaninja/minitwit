'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const message = sequelize.define('message', {
    message_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    author_id: Sequelize.DataTypes.INTEGER,
    text: Sequelize.DataTypes.STRING,
    pub_date: Sequelize.DataTypes.BIGINT,
    flagged: Sequelize.DataTypes.INTEGER,
    //createdAt: Sequelize.DataTypes.DATE,
    //updatedAt: Sequelize.DataTypes.DATE,
  }, {
    freezeTableName: true,
  });
  message.associate = function (models) {
    message.belongsTo(models.user, {
      foreignKey: 'author_id',
      targetKey: 'user_id',
    })
  };
  return message;
};
