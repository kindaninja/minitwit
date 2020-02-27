'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: DataTypes.INTEGER,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    pw_hash: DataTypes.STRING
  }, {});
  User.associate = function(models) {
      User.hasMany(models.Message, {
          foreignKey: 'author_id',
          onDelete: 'CASCADE',
      })
    // associations can be defined here
  };
  return User;
};