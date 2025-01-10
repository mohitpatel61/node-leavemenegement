'use strict';

module.exports = (sequelize, DataTypes) => {
  const LeaveApplication = sequelize.define('LeaveApplication', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Refers to 'users' table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    leave_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'leave_master', // Refers to 'leave_master' table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    leave_from: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    leave_to: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    approver_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending',
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    handled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    handled_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', // Refers to 'users' table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  }, {
    tableName: 'leave_application',
    timestamps: false,
  });

  // Associations
  LeaveApplication.associate = function(models) {
    // A leave application belongs to a user
    LeaveApplication.belongsTo(models.User, { foreignKey: 'user_id', as: 'Applicant' });

    // A leave application references a leave type
    LeaveApplication.belongsTo(models.LeaveMaster, { foreignKey: 'leave_type', as: 'LeaveType' });

    // A leave application may be handled by a user (e.g., manager)
    LeaveApplication.belongsTo(models.User, { foreignKey: 'handled_by', as: 'Handler' });
  };

  return LeaveApplication;
};
