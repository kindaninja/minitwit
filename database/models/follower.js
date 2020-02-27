'use strict';
module.exports = (sequelize, DataTypes) => {
  const Follower = sequelize.define('Follower', {
    who_id: DataTypes.INTEGER,
    whom_id: DataTypes.INTEGER
  }, {});
  Follower.associate = function(models) {
    // associations can be defined here
  };
  return Follower;
};