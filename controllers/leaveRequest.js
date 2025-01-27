const moment = require("moment");
const { LeaveApplication, Manager, User, EmployeeLeave, LeaveMaster, Department, Notification, sequelize, Sequelize } = require("../models");
const { logMessage } = require("../services/logger");
const socketClusterServer = require("socketcluster-server");
const { sendNotification } = require('../notification/notificationService');
const leavesMaster = require("./leavesMaster");
const { where } = require("sequelize");

module.exports = {

  getAjaxLeaveReq: async (req, res) => {
    try {
      // Extract request data
      const { searchData = [], draw = 1, start = 0, length = 10, search = {}, order = [] } = req.body;
      const [fromDate, toDate] = searchData;
      const searchValue = search??'';
      const orderColumn = parseInt(order?.[0]?.column, 10) || 0;
      const orderDir = order?.[0]?.dir === 'desc' ? 'desc' : 'asc';

      // Define order mapping for sorting
      const orderMapping = {
        0: ['created_at', orderDir],
        1: [{ model: User, as: 'Applicant' }, 'first_name', orderDir],
        2: [{ model: User, as: 'Applicant' }, { model: Department, as: 'department' }, 'department_name', orderDir],
        3: [{ model: LeaveMaster, as: 'LeaveType' }, 'leave_type', orderDir],
      };
      const orderClause = orderMapping[orderColumn] || ['created_at', 'desc'];

      // Initialize where clause for search filters
      const whereClause = {};
      if (searchValue) {
        whereClause[Sequelize.Op.or] = [
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Applicant.first_name')), {
            [Sequelize.Op.like]: `%${searchValue.toLowerCase()}%`,
          }),
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Applicant.last_name')), {
            [Sequelize.Op.like]: `%${searchValue.toLowerCase()}%`,
          }),
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Applicant.email')), {
            [Sequelize.Op.like]: `%${searchValue.toLowerCase()}%`,
          }),
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('LeaveType.leave_type')), {
            [Sequelize.Op.like]: `%${searchValue.toLowerCase()}%`,
          }),
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Applicant->department.department_name')), {
            [Sequelize.Op.like]: `%${searchValue.toLowerCase()}%`,
          }),
        ];
      }

      // Add date filters
      if (fromDate && toDate) {
        whereClause.created_at = {
          [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
        };
      } else if (fromDate) {
        whereClause.created_at = { [Sequelize.Op.gte]: new Date(fromDate) };
      } else if (toDate) {
        whereClause.created_at = { [Sequelize.Op.lte]: new Date(toDate) };
      }

      // Role-based filter
      const userId = req.user.id;
      const userRole = req.user.role;
      const whereClauseForRole = userRole === 'Manager' || userRole === 'Admin'
        ? { handled_by: userId }
        : { user_id: userId };

      // Fetch paginated data from the database
      const { count, rows } = await LeaveApplication.findAndCountAll({
        where: { ...whereClause, ...whereClauseForRole },
        include: [
          {
            model: LeaveMaster,
            as: 'LeaveType',
            attributes: ['id', 'leave_type', 'no_of_leaves'],
          },
          {
            model: User,
            as: 'Applicant',
            attributes: ['id', 'first_name', 'last_name'],
            include: [
              {
                model: Department,
                as: 'department',
                attributes: ['id', 'department_name'],
              },
            ],
          },
        ],
        order: [orderClause],
        limit: Math.min(100, parseInt(length, 10) || 10),
        offset: Math.max(0, parseInt(start, 10) || 0),
      });

      // Transform data for the frontend
      const data = rows.map((leaveReq) => ({
        id: leaveReq.id,
        requestername: `${leaveReq.Applicant.first_name} ${leaveReq.Applicant.last_name}`,
        department: leaveReq.Applicant.department?.department_name || 'N/A',
        leave_type: leaveReq.LeaveType.leave_type,
        created_at: new Date(leaveReq.created_at).toLocaleString(),
        status: leaveReq.status,
      }));

      // Send response
      res.json({
        draw: parseInt(draw, 10),
        recordsTotal: count,
        recordsFiltered: count,
        data,
      });
    } catch (error) {
      console.error('Error fetching leave requests:', error.message);
      res.status(500).json({ error: 'Failed to fetch leave requests' });
    }
  },



  // Controller function to render the Employee List view
  getLeaveReqsListView: async (req, res) => {
    try {

      res.render('leave_requests/leave_request', {
        title: 'Leave requests',
      });
    } catch (error) {
      console.error("Error fetching leaves:", error.message);
      res.status(500).send("Internal Server Error");
    }
  },

  getReqDetail: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;


      console.log("=================== leaveReqDetails call===================");
      const whereClauseForRole = userRole === 'Manager' || userRole === 'Admin'
        ? { handled_by: userId }
        : { user_id: userId };
      const leaveReqDetails = await LeaveApplication.findOne({
        where: { id: req.params.id, ...whereClauseForRole },
        // andWhere: whereClauseForRole,
        include: [
          {
            model: LeaveMaster,
            as: 'LeaveType', // Ensure this matches the alias in the association
            attributes: ['id', 'leave_type', 'no_of_leaves'],
          },
          {
            model: User,
            as: 'Applicant',
            attributes: ['id', 'first_name', 'last_name', 'role']
          },
          {
            model: User,
            as: 'Handler',
            attributes: ['id', 'first_name', 'last_name', 'role']
          }
        ],
      });
      // console,log("leaveReqDetails=========",leaveReqDetails);
      if (leaveReqDetails !== null) {
        res.render("leave_requests/leave_request_view", {
          title: 'Leave request detail',
          leaveReqDetails: leaveReqDetails, currentUserData: { id: req.user.id, name: `${req.user.first_name} ${req.user.last_name}`, role: req.user.role }, moment: moment
        });

      }
      else {
        return res.redirect("/leaves/leave-reqs");
        res.redirect("leave_requests/leave_request_view", {
          title: 'Leave request detail',
          leaveReqDetails: leaveReqDetails, currentUserData: { id: req.user.id, name: `${req.user.first_name} ${req.user.last_name}`, role: req.user.role }, moment: moment
        });
      }


    } catch (error) {
      logMessage('error', 'logs/leaveRequestDetail/req-details.log', error.message)
      // res.status(error.status).send(error.message);
    }
  },

  updateLeaveReqStatus: async (req, resp) => {
    let BySelfReject = false;
    if(req.body.BySelfReject){
      BySelfReject = true;
    }
    
    const reqDetail = await LeaveApplication.findOne({
      where: { id: req.body.reqId },
      include: [
        {
          model: LeaveMaster,
          as: 'LeaveType',
          attributes: ['id', 'leave_type']
        }
      ]
    });

    if (reqDetail) {
      reqDetail.status = req.body.status == 'Approve' ? 'Approved' : 'Rejected';
      reqDetail.approver_comment = req.body.comment;
      reqDetail.handled_at = sequelize.fn('NOW');
      await reqDetail.save();

      const empLeaveData = await EmployeeLeave.findOne({
        where: { leave_id: reqDetail.leave_type, user_id: reqDetail.user_id },
        include: [
          {
            model: LeaveMaster,
            as: 'leave',
            attributes: ['id', 'leave_type', 'no_of_leaves']
          }
        ]
      });

      // Revert back balance to particular Emp leave
      if (req.body.status == "Reject") {
        const usedLeaves = empLeaveData.used_leaves - reqDetail.total_days;
        empLeaveData.used_leaves = usedLeaves;
        await empLeaveData.save();
      }
      
      if(!BySelfReject){
      // Create notification
      const notificationMessage = `Leave request ${empLeaveData.leave.leave_type} has been ${reqDetail.status} by ${req.user.name}`;
      const notification = await Notification.create({
        user_id: reqDetail.user_id, // The user who is being notified
        leave_type: empLeaveData.leave.id,
        leave_req_id: reqDetail.id,  // Leave request ID
        message: notificationMessage,
        is_read: false,
        created_at: sequelize.fn('NOW'),
      }).then(async function (res) {
        // Send notification via SocketCluster
        const userSocketId = reqDetail.user_id.toString();
        sendNotification(userSocketId, res.message);
      });
    }
      resp.json("updated");
    }

  },

  sendLeaveRequest: async (req, resp) => {
    // Get handler data (user details)
    const handlerData = await User.findOne({
      where: { id: req.body.empId }
    });

    // Check if handlerData is found
    if (!handlerData) {
      return resp.status(404).json({ message: 'Handler data not found', status: false });
    }

    // Check if created_by exists in handlerData
    if (!handlerData.created_by) {
      return resp.status(400).json({ message: 'Handler data does not have created_by field', status: false });
    }

    const { leaveId, empId, reason, from_date, to_date, total_days } = req.body;

    // Get employee leave data
    const employeeleveData = await EmployeeLeave.findOne({
      where: { id: leaveId, user_id: empId },
      include: [
        {
          model: LeaveMaster,
          as: 'leave',
          attributes: ['id', 'leave_type', 'no_of_leaves']
        }
      ]
    });


    // Check if leave is already applied for the specified date range
    const existingLeave = await LeaveApplication.findAll({
      where: {
        user_id: req.body.empId,
        [Sequelize.Op.or]: [
          // Check if the leave period overlaps with any existing leave application
          {
            leave_from: { [Sequelize.Op.lte]: req.body.to_date }, // from_date is before or equal to the new to_date
            leave_to: { [Sequelize.Op.gte]: req.body.from_date }  // to_date is after or equal to the new from_date
          }
        ]
      }
    });
    if (existingLeave.length > 0) {
      return resp.json({ message: 'Leave has already been applied for the selected dates', status: false });
    }

    // Calculate used leaves
    const usedLeaves = Number(employeeleveData.used_leaves) + Number(total_days);
    if (usedLeaves <= employeeleveData.assigned_leaves) {
      const leaveReq = await LeaveApplication.create({
        user_id: empId,
        leave_type: employeeleveData.leave.id,
        leave_from: from_date,
        leave_to: to_date,
        reason: reason,
        total_days: total_days,
        handled_by: handlerData.created_by,
        created_at: sequelize.fn('NOW'),
        created_by: empId
      }).then(async function (res) {
        // Update used leaves in employee leave data
        employeeleveData.used_leaves = usedLeaves;
        await employeeleveData.save();

        // Create notification
        const notification = await Notification.create({
          user_id: handlerData.created_by, // The user who is being notified
          leave_type: employeeleveData.leave.id,
          leave_req_id: res.id,  // Leave request ID
          message: `New leave request ${employeeleveData.leave.leave_type} from employee: ${handlerData.first_name} ${handlerData.last_name} for ${total_days} days.`,
          is_read: false,
          created_at: sequelize.fn('NOW'),
        }).then(async function (res) {
          // Send notification via SocketCluster
          const userSocketId = handlerData.created_by.toString();
          sendNotification(userSocketId, res.message);
        });
      });

      resp.json({ message: 'Leave applied successfully', status: true });
    } else {
      resp.json({ message: 'You have no leave balance', status: false });
    }
  },

  getEmpLeavesView: async (req, res) => {
    try {

      //  console.log(req.user.id);return false;
      const empDetail = await User.findOne({
        where: { id: req.user.id },
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'department_name'],
          },
          {
            model: User,
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name'],
          },
          {
            model: User,
            as: 'created_by_user',
            attributes: ['id', 'first_name', 'last_name'],
          }
        ],
        attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'status', 'pin_code', 'address']
      });


      // get employee leaves
      const empLeaveData = await EmployeeLeave.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: LeaveMaster,
            as: 'leave',
            attributes: ['id', 'leave_type']
          }
        ]

      });

      console.log("=================== leaveRequests call===================")
      const leaveRequests = await LeaveApplication.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: LeaveMaster,
            as: 'LeaveType', // Ensure this matches the alias in the association
            attributes: ['id', 'leave_type', 'no_of_leaves'],
          },
        ],
        order: [['created_at', 'DESC']], // Order by apply_date in descending order
        limit: 5, // Get only the last 5 records
      });

      // manage leaves reqs data 
      const leaveReqs = await Promise.all(
        leaveRequests.map(async (leaveReq) => {
          const getApproverdata = await User.findOne({
            where: { id: leaveReq.handled_by }
          });
          return {
            ...leaveReq.toJSON(),
            approver: getApproverdata ? getApproverdata.toJSON() : null,
          }
        })

      );


      const departments = await Department.findAll();
      const errorMessages = "";
      res.render("empLeaves", {
        title: 'Leaves',
        empDetail: empDetail, empLeaveData: empLeaveData, leaveRequests: leaveReqs, errorMessages: errorMessages, departments: departments, moment: moment
      });


    } catch (error) {
      res.status(error.status).send(error.message);
    }
  },
  getAjaxLeaveReqs: async (req, res) =>{
 
    try {
      // Calculate pagination values from query parameters or default values
      const limitFrom = parseInt(req.query.limitFrom) || 0;  // Default 0 if not provided
      const limitTo = parseInt(req.query.limitTo) || 5;      // Default 5 if not provided
  console.log(limitFrom)
  console.log(limitTo)

      // Fetch notifications with pagination
      const result = await LeaveApplication.findAndCountAll({
        where: { user_id: req.user.id },
        include: [
            {
                model: LeaveMaster,
                as: 'LeaveType',
                attributes: ['id', 'leave_type', 'no_of_leaves'],
            },
            {
                model: User,
                as: 'Applicant',
                attributes: ['id', 'first_name', 'last_name'],
                include: [
                    {
                        model: Department,
                        as: 'department',
                        attributes: ['id', 'department_name'],
                    },
                ],
            },
            {
                model: User,
                as: 'Handler',
                attributes: ['id', 'first_name', 'last_name', 'role']
            }],
        order: [['created_at', 'desc']],
        offset: limitFrom,
        limit: limitTo,
    });
    
    // console.log(result);  // Log the full result object
    
    return res.json({
        allLeaveRequests: result.rows,
        total: result.count,  // Count is the correct property in some versions of Sequelize
        moment: moment,
    });
    
  
  }  catch (error) {
      console.error('Error fetching requests:', error.message);
      const statusCode = error.status || 500; // Default to 500 if error.status is undefined
      res.status(statusCode).send({ message: error.message });
    }
  },

  getAllNotifications: async (req, res) => {
    const limitFrom = parseInt(req.query.limitFrom) || 0; // Default to 0 if not provided
    const limitTo = parseInt(req.query.limitTo) || 5;     // Default to 5 if not provided

    let unreadNotification = 0;
    let readNotification = 0;

    try {
      // Fetch notifications with pagination
      const allNotifications = await Notification.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'desc']],
        offset: limitFrom,
        limit: limitTo,
      });

      // Separate counts for read and unread notifications
      allNotifications.forEach(notification => {
        if (notification.is_read) {
          readNotification++;
        } else {
          unreadNotification++;
        }
      });

      // Fetch total count of unread notifications (for notification badge)
      const unreadNotificationCount = await Notification.count({
        where: { user_id: req.user.id, is_read: false },
      });

      // Send response
      return res.json({
        allNotificationsData: allNotifications,
        unreadNotificationCount: unreadNotificationCount,
        totalNotificationsFetched: allNotifications.length,
        readNotification: readNotification,
        unreadNotification: unreadNotification,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
      const statusCode = error.status || 500; // Default to 500 if error.status is undefined
      res.status(statusCode).send({ message: error.message });
    }
  },
  markAsRealAllNotification: async (req, res) => {
    try {
      const getUnreadNotifications = await Notification.findAll({
        where: { user_id: req.user.id, is_read: 0 }
      });

      getUnreadNotifications.forEach(async (notification) => {
        notification.is_read = 1;
        await notification.save();
      });
      return res.json({ status: 200 });

    } catch (error) {
      console.error('Error update notifications:', error.message);
      const statusCode = error.status || 500; // Default to 500 if error.status is undefined
      res.status(statusCode).send({ message: error.message });
    }
  }

}