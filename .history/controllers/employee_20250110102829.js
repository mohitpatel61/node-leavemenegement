const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { User, Department, Sequelize, EmployeeLeave, LeaveMaster, LeaveApplication } = require("../models");
const { EmptyResultError, json, Op, where } = require("sequelize");
const moment = require("moment");
const jwt = require('jsonwebtoken');


module.exports = {
  // Controller function to list all employees with pagination
  getAjaxEmployee: async (req, res) => {
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

      // Fetch employees with pagination
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        where :{ created_by: userId},
        include: [
          {
            model: Department,
            as: 'department', 
            attributes: ['department_name'],
          },
          {
            model: User,
            as: 'employee', 
            attributes: ['first_name', 'last_name'],
          },
          {
            model: User,
            as: 'created_by_user', // Alias for the 'created_by' relation
            attributes: ['first_name', 'last_name'], // Fetch the name of the creator
          },
      
        ],
        attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'created_at', 'status'],
        order: [[columns[orderColumn] || 'created_at', orderDir]],
        limit,
        offset,
      });
      // console.log("User.findAndCountAll().toString() ===============", User.findAndCountAll().toString());

      // Format rows for DataTables
      const data = rows.map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        role: employee.role,
        department: employee.department?.department_name || 'N/A',
        manager: employee.created_by_user
          ? `${employee.created_by_user.first_name} ${employee.created_by_user.last_name}`
          : 'N/A',
        created_at: new Date(employee.created_at).toLocaleString(),
        status: employee.status,
        
      }));

      // Return JSON response for DataTables
      res.json({
        draw,
        recordsTotal: count, // Total records
        recordsFiltered: count, // Filtered records
        data, // Paginated data
      });
    } catch (error) {
      console.error("Error in getAjaxEmployee:", error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // Controller function to render the Employee List view
  getEmployeeListView: async (req, res) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(403).json({ error: "No token provided" });
      }
      
      res.render('employee/employee-list', {
        title: 'Employees',
      });
    } catch (error) {
      console.error("Error fetching employees:", error.message);
      res.status(500).send("Internal Server Error");
    }
  },

  // Controller function to add an employee
  getAddEmpView: async (req, res) => {
    try {
     const departments =  await Department.findAll();
     const errorMessages= "";
      
      res.render("employee/employee-add", { title: 'Add employee', errorMessages,
        userData: req.body, departments: departments });
    } catch (error) {
      res.status(error.status).send(error.message);
    }
  },

  getEmpDetail: async (req, res) => {
    try {
      const operationType = req.query.type;
     const empDetail =  await User.findOne({
      where: {id: req.params.id},
      include : [
        {
          model: Department,
          as: 'department',
          attributes: ['id','department_name'],
        },
        {
          model: User,
          as : 'employee',
          attributes: ['id', 'first_name','last_name'],
        },
        {
          model: User,
          as : 'created_by_user',
          attributes: ['id', 'first_name','last_name'],
        }
      ],
      attributes: ['id', 'first_name', 'last_name', 'email', 'role' ,'status', 'pin_code', 'address']
     });
    
    
     // get employee leaves
     const empLeaveData = await EmployeeLeave.findAll({
      where: {user_id : req.params.id},
      include:[
        {
          model: LeaveMaster,
          as: 'leave',
          attributes: ['id', 'leave_type']
        }
      ]

     });


     console.log("=================== leaveRequests call===================")
     const leaveRequests = await LeaveApplication.findAll({
      where: { user_id: req.params.id },
      include: [
          {
              model: LeaveMaster,
              as: 'LeaveType', // Ensure this matches the alias in the association
              attributes: ['id', 'leave_type', 'no_of_leaves'],
          },
      ],
  });

    // manage leaves reqs data 
    const leaveReqs = await Promise.all(
      leaveRequests.map(async (leaveReq) => {
        const getApproverdata = await User.findOne({
          where: {id: leaveReq.handled_by }
        });
        return {
          ...leaveReq.toJSON(),
          approver: getApproverdata ?  getApproverdata.toJSON() : null,
        }
      })
      
    );

     if(operationType == 'view'){
      res.render("employee/employee-view", { title: 'Eemployee detail',
        empDetail: empDetail, empLeaveData: empLeaveData, leaveRequests: leaveReqs, moment: moment });
     }
     else{
      const departments =  await Department.findAll();
      const errorMessages= "";
      res.render("employee/employee-edit", { title: 'Eemployee edit',
        empDetail: empDetail, empLeaveData: empLeaveData, errorMessages:errorMessages, departments: departments });
     }
     
    } catch (error) {
      res.status(error.status).send(error.message);
    }
  },
  addEmp: async (req, res) => {
    try {
      console.log("===================req.body ================================", req.body);
  
      const errors = validationResult(req); // Collect validation errors
      const departments = await Department.findAll(); // Get list of departments
      
      if (!errors.isEmpty()) {
        // If validation errors exist, return to the form with error messages
        const errorMessages = errors.array().map((error) => error.msg);
        return res.render("employee/employee-add", {
          title: "Add Employee",
          errorMessages,
          departments,
          userData: req.body, // Pre-fill form with submitted data
        });
      }
  
      const { firstName, lastName, email, password, passwordConfirm, department } = req.body;
     // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Fetch the manager of the selected department
      const manager = await User.findOne({
        where: {id: req.user.id},
        include: [{
          model: Department,
          as: 'department',
          attributes: ['id']
        }]
      }); 
      
      if (!manager) {
        req.flash("error", "No manager found for this department.");
        return res.redirect("/emp"); // Redirect back to form if no manager found
      }
  
      // Check if the employee email already exists
      const checkEmpEmail = async (email) => {
        return await User.findOne({
          where: { email: email }
        });
      };
  
      const emailCheck = await checkEmpEmail(email);
      if (emailCheck) {
        req.flash("error", "This email " + email + " already exists.");
        return res.redirect("/add-emp"); // Redirect back to form if email exists
      }
  
      // Create the new employee
      await User.create({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: hashedPassword,
        role: 'Employee',
        department_id: manager.department.id,
        created_by: manager.id, // Assign the manager's ID to the employee
      }).then(async function(emp){
            const leaves = await LeaveMaster.findAll();
            leaves.forEach(async (leave) => {
              await EmployeeLeave.create({
                user_id : emp.id,
                user_role : emp.role,
                leave_id : leave.id,
                assigned_leaves : leave.no_of_leaves
              });
            });
      });
  
      req.flash("success", "Employee added successfully!");
      return res.redirect("/emp"); // Redirect back to the form after success
  
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to add employee. Please try again.");
      return res.redirect("/add-emp"); // Redirect back to form on error
    }
  },
  editEmp: async (req, res) => {
    try {
      console.log("===================req.body ================================", req.body);
  
      const errors = validationResult(req); // Collect validation errors
      const departments = await Department.findAll(); // Get list of departments
  
      if (!errors.isEmpty()) {
        // If validation errors exist, return to the form with error messages
        const errorMessages = errors.array().map((error) => error.msg);
        return res.render("employee/employee-edit", {
          title: "Edit Employee",
          errorMessages,
          departments,
          userData: req.body, // Pre-fill form with submitted data
        });
      }
  
      const { firstName, lastName, email, empId } = req.body;
  
  
      // Check if the employee email already exists
      const checkEmpEmail = async (email) => {
        return await User.findOne({
          where: { email: email,  id: { [Op.not]: empId },
        }});
      };
  
      const emailCheck = await checkEmpEmail(email);
      if (emailCheck) {
        req.flash("error", "This email " + email + " already exists.");
        return res.redirect(`/edit-emp/${empId}?type=edit`);
      }
  
      // update the employee
      const getUserData = async(empId) =>{
        return await User.findOne({
          where : {id: empId}
        });
      };

      const updateData = await getUserData(empId);
   
      if(updateData){
        updateData.first_name = firstName;
        updateData.last_name = lastName;
        updateData.email = email;
        await updateData.save();
      }

      req.flash("success", "Employee updated successfully!");
      return res.redirect(`/edit-emp/${empId}?type=edit`);

  
    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to add employee. Please try again.");
      // return res.redirect("/add-emp"); // Redirect back to form on error
    }
  },
  deleteEmp: async (req, res) => {
    try {
      const empId = req.params.id;
  
      const employee = await User.findOne({ where: { id: empId } });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      
      await User.update(
        { deleted_at: new Date() },
        { where: { id: empId } }
      );

      res.json({ success: true, message: 'Employee marked as deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to mark the employee as deleted' });
    }
  }
  
};
