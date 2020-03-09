'use strict';
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    user_id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    pw_hash: DataTypes.STRING,
    //createdAt: DataTypes.DATE,
    //updatedAt: DataTypes.DATE,
  }, {
    freezeTableName: true,
  });
  user.associate = function(models) {
      user.hasMany(models.message, {
          foreignKey: 'author_id',
          sourceKey: 'user_id',
          onDelete: 'CASCADE',
      });
      user.hasMany(models.follower, {
          foreignKey: 'whom_id',
          onDelete: 'CASCASE',
      });
      user.hasMany(models.follower, {
          foreignKey: 'who_id',
          onDelete: 'CASCASE',
    });
    
    // associations can be defined here
  };
  return user;
};