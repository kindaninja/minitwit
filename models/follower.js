'use strict';
module.exports = (sequelize, DataTypes) => {
  const Follower = sequelize.define('Follower', {
    who_id: DataTypes.INTEGER,
    whom_id: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {});
  Follower.associate = function(models) {
    Follower.belongsTo(models.User, {
        foreignKey: 'user_id',
    });
  };
  return Follower;
};