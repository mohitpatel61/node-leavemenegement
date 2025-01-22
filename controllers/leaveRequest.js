const moment = require("moment");
const {LeaveApplication, Manager, User, EmployeeLeave,LeaveMaster,Department, Notification, sequelize, Sequelize} = require("../models");
const { logMessage } = require("../services/logger");
const socketClusterServer = require("socketcluster-server");
const { sendNotification } = require('../notification/notificationService');
const leavesMaster = require("./leavesMaster");

module.exports = {

    getAjaxLeaveReq: async (req, res) => {
        try {
          
         
          
          const draw = parseInt(req.body.draw) || 1; // DataTable draw counter
          const start = parseInt(req.body.start) || 0; // Start index
          const length = parseInt(req.body.length) || 10; // Records per page
          const searchValue = req.body.search || ''; // Search value
          const orderColumn = req.body.order?.[0]?.column || 0; // Ordered column index
          const orderDir = req.body.order?.[0]?.dir || 'asc'; // Order direction (asc/desc)
          const orderMapping = {
            0: ['created_at', orderDir], // Column index 0 - created_at
            1: [{ model: User, as: 'Applicant' }, 'first_name', orderDir], // Column index 1 - requestername
            2: [{ model: User, as: 'Applicant' }, { model: Department, as: 'department' }, 'department_name', orderDir], // Column index 2 - department
            3: [{ model: LeaveMaster, as: 'LeaveType' }, 'leave_type', orderDir], // Column index 3 - leave_type
          };
          const orderClause = orderMapping[orderColumn] || ['created_at', 'asc'];
          const offset = start;
          const limit = length;
    
          
          // Access decoded user data
          const userId = req.user.id;
          const userRole = req.user.role;
          const userName = req.user.name;
          const userEmail = req.user.email;
          
          // Build the "where" clause for search
          const whereClause = searchValue
            ? {
                [Sequelize.Op.or]: [
                  { first_name: { [Sequelize.Op.iLike]: `%${searchValue}%` } },
                  { last_name: { [Sequelize.Op.iLike]: `%${searchValue}%` } },
                  { email: { [Sequelize.Op.iLike]: `%${searchValue}%` } },
                ],
              }
            : {};
              
            console.log("=================== leaveRequests get data===================")
            const whereClauseForRole = userRole === 'Manager' || userRole === 'Admin' 
            ? { handled_by: userId }
            : { user_id: userId };
          
          
            const { count, rows } = await LeaveApplication.findAndCountAll({
                where: { ...whereClause, ...whereClauseForRole},
                include: [
                {
                    model: LeaveMaster,
                    as: 'LeaveType', // Ensure this matches the alias in the association
                    attributes: ['id', 'leave_type', 'no_of_leaves'],
                },
                {
                   model: User,
                   as: 'Applicant',
                   attributes: ['id','first_name', 'last_name'],

                   include:[
                    {
                    model: Department,
                    as: 'department',
                    attributes: ['id','department_name'],
                    }
                  ]
                },
               
              
                ],
                order: [orderClause],
                limit,
                offset,
              });
            

          
          // Format rows for DataTables
          const data = rows.map((leaveReq) => ({
          
            id: leaveReq.id,
            requestername: `${leaveReq.Applicant.first_name} ${leaveReq.Applicant.last_name}`,
            department: `${leaveReq.Applicant.department.department_name}`, 
            leave_type: leaveReq.LeaveType.leave_type,          
            created_at: new Date(leaveReq.created_at).toLocaleString(),
            status: leaveReq.status,
            
          }));
    
          // Return JSON response for DataTables
          res.json({
            draw,
            recordsTotal: count, // Total records
            recordsFiltered: count, // Filtered records
            data, // Paginated data
          });
        } catch (error) {
          console.error("Error :", error.message);
          res.status(500).json({ error: 'Internal Server Error' });
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
            where: {id: req.params.id , ...whereClauseForRole},
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
                    attributes: ['id','first_name', 'last_name', 'role']
                 },
                 {
                    model: User,
                    as: 'Handler',
                    attributes: ['id','first_name', 'last_name','role']
                 }
            ],
        });
        // console,log("leaveReqDetails=========",leaveReqDetails);
        if(leaveReqDetails !== null){
          res.render("leave_requests/leave_request_view", { title: 'Leave request detail',
            leaveReqDetails: leaveReqDetails, currentUserData: {id: req.user.id, name: `${req.user.first_name} ${req.user.last_name}`, role:req.user.role}, moment: moment });
         
        }
        else{
          return res.redirect("/leaves/leave-reqs");
          res.redirect("leave_requests/leave_request_view", { title: 'Leave request detail',
            leaveReqDetails: leaveReqDetails, currentUserData: {id: req.user.id, name: `${req.user.first_name} ${req.user.last_name}`, role:req.user.role}, moment: moment });
        }
        
         
        } catch (error) {
          logMessage('error','logs/leaveRequestDetail/req-details.log',error.message)
          // res.status(error.status).send(error.message);
        }
      },

    updateLeaveReqStatus: async(req, resp) => {
       
        const reqDetail = await LeaveApplication.findOne({
            where: {id: req.body.reqId},
            include: [
                {
                    model: LeaveMaster,
                    as: 'LeaveType',
                    attributes: ['id', 'leave_type']
                }
            ]
        });
         
        if(reqDetail){
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
            if(req.body.status == "Reject"){
               

            const usedLeaves = empLeaveData.used_leaves - reqDetail.total_days;
            empLeaveData.used_leaves = usedLeaves;
            await empLeaveData.save();
        }

         // Create notification
         const notificationMessage = `Leave request ${empLeaveData.leave.leave_type} has been ${reqDetail.status} by ${req.user.name}`;
         console.log("notificationMessage========",notificationMessage);
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

    getEmpLeavesView: async(req, res) => {
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
          attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'status','pin_code','address']
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

    getAllNotifications: async(req, res) => {
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
      }catch (error) {
        console.error('Error fetching notifications:', error.message);
        const statusCode = error.status || 500; // Default to 500 if error.status is undefined
        res.status(statusCode).send({ message: error.message });
      }
    },
    markAsRealAllNotification: async(req, res) =>{
      try {
        const getUnreadNotifications = await Notification.findAll({
          where: {user_id: req.user.id, is_read: 0}
        });
        
        getUnreadNotifications.forEach(async (notification)=>{
          notification.is_read = 1;
          await notification.save();
        });
        return res.json({status:200});
      
      } catch (error) {
         console.error('Error update notifications:', error.message);
        const statusCode = error.status || 500; // Default to 500 if error.status is undefined
        res.status(statusCode).send({ message: error.message });
      }
    }

}