const express = require("express");
const router = express.Router();

const departmentController = require("../controllers/department");

router.get("/department", departmentController.getDepartmentListView);

module.exports = router;