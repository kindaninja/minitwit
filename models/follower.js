'use strict';
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const follower = sequelize.define('follower', {
    who_id: DataTypes.INTEGER,
    whom_id: DataTypes.INTEGER,
    //createdAt: DataTypes.DATE,
    //updatedAt: DataTypes.DATE,
  }, {
    freezeTableName: true,
  });
  follower.associate = function(models) {
    follower.belongsTo(models.user, {
      targetKey: 'user_id',
      foreignKey: 'who_id',
    });
    follower.belongsTo(models.user, {
      targetKey: 'user_id',
      foreignKey: 'whom_id',
    });
  };
  follower.removeAttribute('id');
  return follower;
};