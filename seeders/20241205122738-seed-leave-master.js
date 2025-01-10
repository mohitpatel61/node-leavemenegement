'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert default leave types into leave_master
    await queryInterface.bulkInsert('leave_master', [
      { leave_type: 'CL', no_of_leaves: 12, status: true },
      { leave_type: 'PL', no_of_leaves: 18, status: true },
      { leave_type: 'SL', no_of_leaves: 10, status: true },
      { leave_type: 'Vacation', no_of_leaves: 30, status: true },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove all entries from leave_master
    await queryInterface.bulkDelete('leave_master', null, {});
  },
};
