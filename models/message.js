'use strict';
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    message_id: DataTypes.INTEGER,
    author_id: DataTypes.INTEGER,
    text: DataTypes.STRING,
    pub_date: DataTypes.INTEGER,
    flagged: DataTypes.INTEGER
  }, {});
  Message.associate = function (models) {
    Message.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'auhtor',
    })
  };
  return Message;
};