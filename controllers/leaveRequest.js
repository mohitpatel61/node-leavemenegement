const moment = require("moment");
const {LeaveApplication, Manager, User, EmployeeLeave,LeaveMaster,Department, Notification, sequelize, Sequelize} = require("../models");
const { logMessage } = require("../services/logger");

module.exports = {

    getAjaxLeaveReq: async (req, res) => {
        try {
          
         
          
          const draw = parseInt(req.body.draw, 10) || 1;
          const start = Math.max(0, parseInt(req.body.start, 10)) || 0;
          const length = Math.min(100, parseInt(req.body.length, 10)) || 10;
          const searchValue = req.body.search || '';
          const orderColumn = parseInt(req.body.order?.[0]?.column, 10) || 0;
          const orderDir = req.body.order?.[0]?.dir === 'desc' ? 'desc' : 'asc';
          
          const orderMapping = {
            0: ['created_at', orderDir],
            1: [{ model: User, as: 'Applicant' }, 'first_name', orderDir],
            2: [{ model: User, as: 'Applicant' }, { model: Department, as: 'department' }, 'department_name', orderDir],
            3: [{ model: LeaveMaster, as: 'LeaveType' }, 'leave_type', orderDir],
          };
          const orderClause = orderMapping[orderColumn] || ['created_at', 'asc'];
          const offset = start;
          const limit = length;
          
          // User information
          const userId = req.user.id;
          const userRole = req.user.role;
          
          // Search filter
          const whereClause = searchValue
          ? {
              [Sequelize.Op.or]: [
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
              ],
            }
          : {};
        
          
          // Role-based filter
          const whereClauseForRole = userRole === 'Manager' || userRole === 'Admin' 
            ? { handled_by: userId }
            : { user_id: userId };
          
          try {
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
              limit,
              offset,
            });
        
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
            console.error("Error fetching leave requests:", error);
            res.status(500).json({ error: "Failed to fetch leave requests" });
          }
   
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

            // Revert back balance to particular Emp leave
            if(req.body.status == "Reject"){
                const empLeaveData = await EmployeeLeave.findOne({
                    where: {user_id: reqDetail.user_id, leave_id: reqDetail.leave_type}
                });

            const usedLeaves = empLeaveData.used_leaves - reqDetail.total_days;
            empLeaveData.used_leaves = usedLeaves;
            await empLeaveData.save();
                
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
                  message: `New leave request ${employeeleveData.leave.leave_type} from employee ID: ${empId} for ${total_days} days.`,
                  is_read: false,
                  created_at: sequelize.fn('NOW'),
              });

              const userSocketId = handlerData.created_by.toString();
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
    }
}