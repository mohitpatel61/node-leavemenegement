const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const leaveRequestController = require("../controllers/leaveRequest");
const authorize = require('../middlewares/authorize');

router.get('/leave-req-detail/:id',authorize(['Admin','Manager','Employee']), leaveRequestController.getReqDetail);
router.get("/leave-reqs",authorize(['Admin','Manager','Employee']), leaveRequestController.getLeaveReqsListView);
router.get("/my-leaves",authorize(['Manager','Employee']), leaveRequestController.getEmpLeavesView);
router.post("/leave-req-ajax", authorize(['Admin','Manager','Employee']), leaveRequestController.getAjaxLeaveReq);

router.post("/update-req-status",authorize(['Admin','Manager','Employee']), leaveRequestController.updateLeaveReqStatus);
router.post('/send-leave-application',authorize(['Manager','Employee']), leaveRequestController.sendLeaveRequest);

module.exports = router;