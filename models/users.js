'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true, // NULL allowed
    },
    pin_code: {
      type: DataTypes.STRING,
      allowNull: true, // NULL allowed
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments', // Ensure this matches your Department table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Manager', 'Employee'),
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // True = Active, False = Inactive
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow NULL for cases where no creator is set
      references: {
        model: 'users', // Reference to the same table
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE, // Add column for soft delete
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true, // Allows NULL for users without a profile image
    },
    thumbnail_image: {
      type: DataTypes.STRING,
      allowNull: true, // Allows NULL for users without a profile image
    },
  },  {
    sequelize,
    modelName: 'User',
    tableName: 'users', // Explicitly define table name
    timestamps: true,   // Enable timestamps (created_at, updated_at)
    paranoid: true,     // Enable soft deletes
    deletedAt: 'deleted_at', // Use custom column name for deleted_at
    createdAt: 'created_at',
    updatedAt: 'updated_at',

  });

  // Hooks (Optional) - Automatically update the `updated_at` field
  User.beforeUpdate((user, options) => {
    user.updated_at = new Date();
  });

  User.associate = function(models) {
    User.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
    User.hasMany(models.User, { foreignKey: 'created_by', as: 'employee' });
    User.belongsTo(models.User, { foreignKey: 'created_by', as: 'created_by_user' });

    User.hasMany(models.LeaveApplication, { foreignKey: 'user_id', as: 'requester' });
    User.hasMany(models.LeaveApplication, { foreignKey: 'handled_by', as: 'Handler' });

  };
  return User;
};
