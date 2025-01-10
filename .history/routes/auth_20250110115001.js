const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authorize = require('../middlewares/authorize');
const authController = require("../controllers/authController");

router.get("/login", authController.getLoginView);
// router.get("/profile", authorize(['Manager', 'Employee', 'Admin']), authController.getUserProfileView);
// router.post(
//   "/login",
//   [
//     body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
//     body("password").trim().isLength({ min: 1 }).withMessage("Password is required").escape(),
//   ],
//   authController.userLogin
// );

router.post(
  "/upload-profile-picture", 
  authorize(['Manager', 'Employee', 'Admin']),  // Ensure that the user is authorized
  authController.upload,  // Use the upload middleware for handling file upload
  authController.uploadProfilePicture // New controller function for saving the uploaded image
);

router.post(
  "/edit-profile", authorize(['Manager', 'Employee', 'Admin']),
  [
    body("firstName").trim().isLength({ min: 1 }).withMessage("First name is required").escape(),
    body("lastName").trim().isLength({ min: 1 }).withMessage("Last name is required").escape(),
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("pinCode").trim().isNumeric().isLength({ min: 5, max:6 }).withMessage("Pincode must be maximum 6 and Min 6 digits").escape(),
  ],
  authController.editProfile
);

router.get(
  "/logout", authorize(['Manager', 'Employee', 'Admin']),
  authController.logout
);

module.exports = router;