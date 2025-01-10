const express = require("express");
const router = express.Router();

const auth = require("./auth");
const dashboard = require("./dashboard");
const employee = require("./employee");
const manager = require("./manager");
const department = require("./department");
const leaves = require("./leaves_master");
const leaveRequest = require("./leaveRequest");
const userProfile = require("./userProfile");


router.use("/dashboard", dashboard);
router.use("/employee", employee);
router.use("/", department);
router.use("/emp-leaves", leaves);
router.use("/manager", manager);
router.use("/leaves", leaveRequest);
router.use('/user-profile',userProfile);
router.use("/mp", auth);

module.exports = router;
