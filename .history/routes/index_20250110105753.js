const express = require("express");
const router = express.Router();

const auth = require("./auth");
const dashboard = require("./dashboard");
const employee = require("./employee");
const manager = require("./manager");
const department = require("./department");
const leaves = require("./leaves_master");
const leaveRequest = require("./leaveRequest");


router.use("/dashboard", dashboard);
router.use("/employee", employee);
router.use("/", department);
router.use("/emp-leaves", leaves);
router.use("/manager", manager);
router.use("/", leaveRequest);
router.use("/", auth);

module.exports = router;
