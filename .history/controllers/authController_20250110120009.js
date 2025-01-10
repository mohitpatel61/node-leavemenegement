const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const fs = require('fs')
const { User, Department, LeaveApplication, LeaveMaster, EmployeeLeave } = require("../models");
const moment = require("moment");
const { Op } = require("sequelize");
const { logMessage } = require("../services/logger");

module.exports = {
 

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
