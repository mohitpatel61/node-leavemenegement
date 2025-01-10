'use strict';

module.exports = (sequelize, DataTypes) => {
  const LeaveMaster = sequelize.define('LeaveMaster', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    leave_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    no_of_leaves: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'leave_master', // Explicitly define table name
    timestamps: false, // Disable automatic timestamps
  });


  return LeaveMaster;
};
