'use strict';

module.exports = (sequelize, DataTypes) => {
  const EmployeeLeave = sequelize.define('EmployeeLeave', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Refers to the 'users' table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    leave_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leave_master', // Refers to the 'leave_master' table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    assigned_leaves: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    used_leaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0, // Default value for used_leaves
    },
  }, {
    tableName: 'employee_leave',
    timestamps: false, // Enable automatic timestamp management by Sequelize
  });

  // Associations
  EmployeeLeave.associate = (models) => {
    // EmployeeLeave belongs to a User
    EmployeeLeave.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // EmployeeLeave belongs to a LeaveMaster
    EmployeeLeave.belongsTo(models.LeaveMaster, {
      foreignKey: 'leave_id',
      as: 'leave',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };
  
  return EmployeeLeave;
};
