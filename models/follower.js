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
        targetKey: 'user_id',
        foreignKey: 'who_id',
    });
    Follower.belongsTo(models.User, {
      targetKey: 'user_id',
      foreignKey: 'whom_id',
    });
  };
  return Follower;
};