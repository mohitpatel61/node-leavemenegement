const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const fs = require('fs')
const { User, Department, LeaveApplication, LeaveMaster, EmployeeLeave } = require("../models");
const moment = require("moment");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require('path');  // Add this line to import the 'path' module
const imageUploadFolder = path.join(__dirname, '..', 'uploads', 'profile_pics'); // Your folder path
const thumbnailFolder = path.join(imageUploadFolder, 'thumbnails');

// Ensure the thumbnail directory exists
if (!fs.existsSync(thumbnailFolder)) {
  fs.mkdirSync(thumbnailFolder, { recursive: true });
}



module.exports = {
  upload: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = './uploads/profile_pics/';
        
        // Check if the directory exists, if not create it
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir); // Specify the folder where files will be uploaded
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Filename with timestamp
      }
    }),
    limits: { fileSize: 30 * 1024 * 1024 }, // Max file size of 5MB
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png|gif/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Only image files are allowed!'));
    }
  }).single('profileImage'),  // Expecting the file input field to be named 'profileImage'

  // New function to upload profile picture
  uploadProfilePicture: async (req, res) => {
    try {
      const userId = req.user.id; // Get the user ID from the session or JWT token
      const file = req.file; // Assuming you're using multer

      if (!file) {
        return res.status(400).send('No file uploaded');
      }

      // Generate a new filename using current timestamp (or you can use UUID or any other strategy)
      const imageName = moment().valueOf() + path.extname(file.originalname).toLowerCase();
      const imagePath = `/uploads/profile_pics/${imageName}`; // This is the path to store in the database
      const thumbnailPath = `/uploads/profile_pics/thumbnails/${imageName}`;


      // Update the user's profile image in the database
      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

       // If the user already has a profile image, delete the old one
       if (user.profile_image) {
        const oldImagePath = path.join(__dirname, '..', user.profile_image); // Construct the full path
        const oldThumbnailPath = path.join(__dirname, '..', user.thumbnail_image);

        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath); // Delete the old image file
        if (fs.existsSync(oldThumbnailPath)) fs.unlinkSync(oldThumbnailPath);
      }

      // Update the user's profile image field
      user.profile_image = imagePath;
      await user.save();
      fs.renameSync(file.path, path.join(imageUploadFolder, imageName));

      // Respond with success message
      res.status(200).json({ message: 'Profile picture uploaded successfully',status: 'success', profileImage: imagePath });
    } catch (error) {
      res.status(200).json({ message: 'Profile picture uploaded successfully', status: 'error', error });
      console.log('Error uploading profile picture:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  },

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
      console.log("===================req.body ================================", req.body);

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
        return res.redirect("/login"); // Redirect back to form if email exists
      }

      const isMatch = await bcrypt.compare(password, userInfo.password);
      if (!isMatch) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/login"); // Redirect back to form if email exists
      }

      const token = jwt.sign({ id: userInfo.id, departmentName: userInfo?.department?.department_name, role: userInfo.role, name: `${userInfo.first_name} ${userInfo.last_name}`, email: userInfo.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // use HTTPS in production
        maxAge: 3600000, // 1 hour
      });
      req.flash("success", "Login successfully!");
      return res.redirect("/"); // Redirect back to the form after success

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
        attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'status','pin_code','address', 'profile_image']
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
