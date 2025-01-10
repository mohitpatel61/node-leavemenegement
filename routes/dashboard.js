const express = require("express");
const router = express.Router();
const authorize = require('../middlewares/authorize');

const dashboardController = require("../controllers/dashboard");

router.get("/", authorize(['Admin', 'Manager', 'Employee']), dashboardController.getDashboardView);

module.exports = router;