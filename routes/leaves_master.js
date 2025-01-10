const express = require("express");
const router = express.Router();

const leavesController = require("../controllers/leavesMaster");

router.get('/leaves', leavesController.getLeavesList);

module.exports = router;
