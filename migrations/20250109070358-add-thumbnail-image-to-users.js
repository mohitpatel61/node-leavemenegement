'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'thumbnail_image', {
      type: Sequelize.STRING,
      allowNull: true, // Optional: Set `false` if it's a required field
      after: 'profile_image' // Places the column after `profile_image` in the table
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'thumbnail_image');
  }
};
