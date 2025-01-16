'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Refers to 'users' table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      leave_type: {
        type: Sequelize.INTEGER,
        allowNull: true,  // Make this nullable
        references: {
          model: 'leave_master', // Refers to 'leave_master' table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',  // Allow setting it to NULL if the referenced leave_master is deleted
      },
      leave_req_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'leave_application', // Refers to 'leave_application' table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification');
  },
};
