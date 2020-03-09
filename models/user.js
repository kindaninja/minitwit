'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: DataTypes.INTEGER,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    pw_hash: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
  User.associate = function(models) {
      User.hasMany(models.Message, {
          foreignKey: 'author_id',
          sourceKey: 'user_id',
          onDelete: 'CASCADE',
      });
      User.hasMany(models.Follower, {
          foreignKey: 'whom_id',
          onDelete: 'CASCASE',
      });
      User.hasMany(models.Follower, {
          foreignKey: 'who_id',
          onDelete: 'CASCASE',
    });
    
    // associations can be defined here
  };
  return User;
};