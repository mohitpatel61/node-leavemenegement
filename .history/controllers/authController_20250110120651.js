const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const fs = require('fs')
const { User, Department, LeaveApplication, LeaveMaster, EmployeeLeave } = require("../models");
const moment = require("moment");
const { Op } = require("sequelize");
const { logMessage } = require("../services/logger");

module.exports = {


  getLoginView: async (req, res) => {
    try {
      const errorMessages = "";

      res.render("login", {
        title: 'Login', errorMessages,
        userData: req.body
      });
    } catch (error) {
      res.status(error.status).send(error.message);
    }
  },

  userLogin: async (req, res) => {
    try {
      const errors = validationResult(req); // Collect validation errors
    

      if (!errors.isEmpty()) {
        // If validation errors exist, return to the form with error messages
        const errorMessages = errors.array().map((error) => error.msg);
        return res.render("login", {
          title: "Login",
          errorMessages,
          userData: req.body, // Pre-fill form with submitted data
        });
      }

      const { email, password } = req.body;
      //  res.json(req.body);
      const checkuserData = async (email) => {
        return await User.findOne({
          where: { email: email },
          include: [
            {
              model: Department,
              as : 'department',
              attributes: ['id', 'department_name']
            }
          ]
        });
      };

      const userInfo = await checkuserData(email);
      // console.log(emailCheck);return false;
      if (!userInfo) {
       
        req.flash("error", "Invalid email or password");
        logMessage('info','logs/userLogin.log','User not found for Login data = '+req.body.email+ 'Password = '+req.body.password);
        return res.redirect("/login"); // Redirect back to form if email exists
      }

      const isMatch = await bcrypt.compare(password, userInfo.password);
      if (!isMatch) {
        req.flash("error", "Invalid email or password");
        logMessage('info','logs/userLogin.log','Password is Not match Login data = '+req.body.email+ 'Password = '+req.body.password);
        return res.redirect("/login"); // Redirect back to form if email exists
      }

      const token = jwt.sign({ id: userInfo.id, departmentName: userInfo?.department?.department_name, role: userInfo.role, name: `${userInfo.first_name} ${userInfo.last_name}`, email: userInfo.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // use HTTPS in production
        maxAge: 3600000, // 1 hour
      });
      req.flash("success", "Login successfully!");
      return res.redirect("/dashboard"); // Redirect back to the form after success

    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to login. Please try again.");
      return res.redirect("/login"); // Redirect back to form on error
    }
  },

  getUserProfileView: async (req, res) => {
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
        attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'status','pin_code','address', 'profile_image', 'thumbnail_image']
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
      res.render("userProfile", {
        title: 'Profile',
        empDetail: empDetail, empLeaveData: empLeaveData, leaveRequests: leaveReqs, errorMessages: errorMessages, departments: departments, moment: moment
      });


    } catch (error) {
      res.status(error.status).send(error.message);
    }
  },

  editProfile: async (req, res) => {
    try {
      console.log("===================req.body ================================", req.body);

      const errors = validationResult(req); // Collect validation errors
      const departments = await Department.findAll(); // Get list of departments
      const getUserData =  await User.findOne({
          where: { id: req.user.id }
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
    
// console.log("getUserData ===============",getUserData);return false;
      if (!errors.isEmpty()) {
        // If validation errors exist, return to the form with error messages
        const errorMessages = errors.array().map((error) => error.msg);
        return res.render("userProfile", {
          title: "Edit Profile",
          errorMessages,
          departments,
          empLeaveData: empLeaveData,
           leaveRequests: leaveReqs,
          empDetail: getUserData, // Pre-fill form with submitted data
        });
      }

      const { firstName, lastName, email, pinCode, address } = req.body;


      // Check if the employee email already exists
      const checkEmpEmail = async (email) => {
        return await User.findOne({
          where: {
            email: email, id: { [Op.not]: req.user.id },
          }
        });
      };

      const emailCheck = await checkEmpEmail(email);
      if (emailCheck) {
        req.flash("error", "This email " + email + " already exists.");
        return res.redirect(`/profile`);
      }

      // update the profile
     
      if (getUserData) {
        getUserData.first_name = firstName;
        getUserData.last_name = lastName;
        getUserData.pin_code = pinCode;
        getUserData.address = address;
        await getUserData.save();
      }

      req.flash("success", "Profile updated successfully!");
      return res.redirect('/profile');


    } catch (error) {
      console.error(error);
      req.flash("error", "Failed to Update profile. Please try again.");
      return res.redirect('/profile');
    }
  },

  logout: async (req, res) => {
    try {
      // Clear authentication cookie
      res.clearCookie('token');
      req.flash("success", "Log out successfully .....");
      return res.redirect('/login');
      // Destroy session if used
     
    } catch (error) {
      console.error("Logout error:", error);
      req.flash("error", "Failed to Log out. Please try again.");
      return res.redirect('/profile');
    }
  }
  

};
