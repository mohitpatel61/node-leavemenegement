'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert default leave types into departments
    await queryInterface.bulkInsert('departments', [
      { department_name: 'Panteon', created_by: 1, status: true },
      { department_name: 'UI', created_by: 1, status: true },
      { department_name: 'HR', created_by: 1, status: true },
      { department_name: 'Admin', created_by: 1, status: true },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove all entries from departments
    await queryInterface.bulkDelete('departments', null, {});
  },
};
