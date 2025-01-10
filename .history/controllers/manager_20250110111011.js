
// const i18n = require("i18n");

// const Manager = require("../models/Manager");
const { validationResult } = require('express-validator');
const { User, Department, Sequeliz, LeaveMaster, EmployeeLeave, LeaveApplication } = require('../models'); // Import the ManagerUser model
const { where, Op } = require('sequelize');
const bcrypt = require('bcrypt');
const moment = require('moment');

module.exports = {
  //Controller function to list all the services
  getAjaxManager: async (req, res) => {
    try {
   
      const draw = parseInt(req.body.draw) || 1; // DataTable draw counter
      const start = parseInt(req.body.start) || 0; // Start index
      const length = parseInt(req.body.length) || 10; // Records per page
      const searchValue = req.body.search || ''; // Search value
      const orderColumn = req.body.order?.[0]?.column || 0; // Ordered column index
      const orderDir = req.body.order?.[0]?.dir || 'asc'; // Order direction (asc/desc)
      const columns = ['created_at', 'first_name', 'email', 'role', 'status']; // Define columns for ordering
      const offset = start;
      const limit = length;

      // Build the "where" clause for search
      const whereClause = searchValue
        ? {
            [Sequelize.Op.or]: [
              { first_name: { [Sequelize.Op.like]: `%${searchValue}%` } },
              { last_name: { [Sequelize.Op.like]: `%${searchValue}%` } },
              { email: { [Sequelize.Op.like]: `%${searchValue}%` } },
            ],
          }
        : {};
    
      // Fetch Manager with pagination
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        where: {role: 'Manager'},
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['department_name'],
          }
        ],
        attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'created_at', 'status'],
        order: [[columns[orderColumn] || 'created_at', orderDir]],
        limit,
        offset,
      });

      // Format rows for DataTables
      const data = rows.map((manager) => ({
        id: manager.id,
        name: `${manager.first_name} ${manager.last_name}`,
        email: manager.email,
        role: manager.role,
        department: manager.department ? manager.department.department_name : 'N/A',
        created_at: new Date(manager.created_at).toLocaleString(),
        status: manager.status,
        
      }));

      // Return JSON response for DataTables
      res.json({
        draw,
        recordsTotal: count, // Total records
        recordsFiltered: count, // Filtered records
        data, // Paginated data
      });
    } catch (error) {
      console.error("Error in getAjaxmanager:", error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // Controller function to render the manager List view
  getManagerListView: async (req, res) => {
    try {
      res.render('manager/manager-list', {
        title: 'Managers',
      });
    } catch (error) {
      console.error("Error fetching managers:", error.message);
      res.status(500).send("Internal Server Error");
    }
  },

  addManagerView: async (req, res) => {
    try {
      const departments =  await Department.findAll();
     const errorMessages= "";
      const userInfo = '';
      res.render("manager/manager-add", { title: 'Add manager', userData: userInfo, departments: departments, errorMessages: errorMessages  });
    } catch (error) {
      utils.logError(`${error.status || 500} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${error.message}`);
      res.redirect("/");
    }
  },

  addManager: async (req, res) => {
    try {
      console.log("===================req.body ================================", req.body);
  
      const errors = validationResult(req); // Collect validation errors
      const departments = await Department.findAll(); // Get list of departments
  
      if (!errors.isEmpty()) {
        // If validation errors exist, return to the form with error messages
        const errorMessages = errors.array().map((error) => error.msg);
        return res.render("manager/manager-add", {
          title: "Add Manager",
          errorMessages,
          departments,
          userData: req.body, // Pre-fill form with submitted data
        });
      }
  
      const { firstName, lastName, email, password, passwordConfirm, department } = req.body;
  

  
      // Check if the Manager email already exists
      const checkEmpEmail = async (email) => {
        return await User.findOne({
          where: { email: email }
        });
      };
  
      const emailCheck = await checkEmpEmail(email);
      if (emailCheck) {
        req.flash("error", "This email " + email + " already exists.");
        return res.redirect("/manager/add-manager"); // Redirect back to form if email exists
      }
      const departMentData = await Department.findOne({
        where: {id: department}
      });
      // check if any managaer add for selected department
      const checkDeptManager = await User.findOne({
        where: {department_id: department}
      });
      if(checkDeptManager){
        req.flash("error", "Manager is already for this delartment "+departMentData.department_name+"");
        return res.redirect('/manager');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create the new employee
      await User.create({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: hashedPassword,
        role: 'Manager',
        department_id: department,
        created_by: 1, // Need to change and set master admin ID
      }).then(async function(manager){
            const leaves = await LeaveMaster.findAll();
            leaves.forEach(async (leave) => {
              await EmployeeLeave.create({
                user_id : manager.id,
                leave_id : leave.id,
                assigned_leaves : leave.no_of_leaves
              });
            });
      });
  
      req.flash("success", "Manager added successfully!");
      return res.redirect("/manager"); // Redirect back to the form after success
  
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to add manager. Please try again.");
      return res.redirect("/manager"); // Redirect back to form on error
    }
  },

  getManagerDetail : async (req, res) => {
  try{

    const type = req.query.type;
    
    const managerData = await User.findOne({
      where: {id: req.params.id},
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'department_name']
        },
      ],
      attributes:['id','first_name','last_name','email','status','role','created_at', 'pin_code', 'address']
    });
    // res.json(managerData);
     // get managerLeaves
     const managerLeaves= await EmployeeLeave.findAll({
      where: {user_id: req.params.id},
      include: [{
        model: LeaveMaster,
        as: 'leave',
        attributes: ['id','leave_type']
      }]
     });
     

     // get leave requests 
     const managerLeaveReqs = await LeaveApplication.findAll({
      where: {handled_by: req.params.id},
      include:[
        {
          model: LeaveMaster,
          as: "LeaveType",
          attributes: ['id', 'leave_type', 'no_of_leaves']
        }
      ]
     });
     console.log("============ leave requests =================================")
    //  res.json(managerLeaveReqs);
    //  console.log("============ leave requests =================================")
     const leaveRequests = await Promise.all(
      managerLeaveReqs.map(async (leaveReq) => {
        const getEmpdata = await User.findOne({
          where: {id: leaveReq.user_id}
        });

        return {
          ...leaveReq.toJSON(),
          requestor: getEmpdata ? getEmpdata.toJSON() : null
        }

      })
     );
    //  res.json(leaveRequests);
    

     if(type == 'view'){
      res.render('manager/manager-view', { title: 'Manager details',moment:moment, managerDetails: managerData, managerLeaves: managerLeaves, leaveRequests: leaveRequests});
     }
     else{
      const departments =  await Department.findAll();
      const errorMessages= "";
      res.render('manager/manager-edit', { title: 'Manager upate', managerDetails: managerData, departments: departments, errorMessages: errorMessages, managerLeaves: managerLeaves});
     }
     
  }
  catch(error){

  }
},

editManager: async (req, res) => {
  try {

    const errors = validationResult(req); // Collect validation errors
    const departments = await Department.findAll(); // Get list of departments

    if (!errors.isEmpty()) {
      // If validation errors exist, return to the form with error messages
      const errorMessages = errors.array().map((error) => error.msg);
      return res.render("manager/manager-edit", {
        title: "Edit Manager",
        errorMessages,
        departments,
        userData: req.body, // Pre-fill form with submitted data
      });
    }

    const { firstName, lastName, email, managerId } = req.body;

    // Check if the Manager email already exists
    const checkEmpEmail = async (email) => {
      return await User.findOne({
        where: { email: email,  id: { [Op.not]: managerId },
      }});
    };

    const emailCheck = await checkEmpEmail(email);
    if (emailCheck) {
      req.flash("error", "This email " + email + " already exists.");
      return res.redirect(`/manager/edit-manager/${managerId}?type=edit`);
    }

      // Check if the Manager  already exists for dept
      // const checkDeptManager = async (department) => {
      //   return await User.findOne({
      //     where: { department_id: department, role: 'Manager',  id: { [Op.not]: managerId },
      //   }});
      // };
  
      // const deptManagerCheck = await checkDeptManager(department);
     
      // if (deptManagerCheck) {
      //   req.flash("error", "Manager is already assigned to this department.");
      //   return res.redirect(`/edit-manager/${managerId}?type=edit`);
      // }

    // update the manager
    const getUserData = async(managerId) =>{
      return await User.findOne({
        where : {id: managerId}
      });
    };

    const updateData = await getUserData(managerId);
 
    if(updateData){
      updateData.first_name = firstName;
      updateData.last_name = lastName;
      updateData.email = email;
      await updateData.save();
    }

    req.flash("success", "Manager updated successfully!");
    return res.redirect(`/manager`);


  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to add manager. Please try again.");
    return res.redirect(`/edit-manager/${req.params.id}?type=edit`); // Redirect back to form on error
  }
},
deleteManager: async (req, res) => {
  try {
    const managerId = req.params.id;

    const manager = await User.findOne({ where: { id: managerId } });
    if (!manager) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await User.update(
      { deleted_at: new Date() },
      { where: { id: managerId } }
    );

    res.json({ success: true, message: 'User marked as deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to mark the user as deleted' });
  }
}

}
