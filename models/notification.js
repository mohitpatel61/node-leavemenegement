
'use strict';
module.exports = (sequelize, DataTypes) => {
const Notification = sequelize.define('Notification', {
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
    allowNull: false,
    references: {
      model: 'leave_master', // Refers to 'leave_master' table
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  leave_req_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'leave_application',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
},{
  tableName: 'notification',
  timestamps: false
});

// Associations
Notification.associate = function(models) { 
  // A leave application belongs to a user
  Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

  // A leave application references a leave type
  Notification.belongsTo(models.LeaveMaster, { foreignKey: 'leave_type', as: 'LeaveType' });
  Notification.belongsTo(models.LeaveApplication, { foreignKey: 'leave_req_id', as: 'leaveReq' });
};
return Notification;
};
