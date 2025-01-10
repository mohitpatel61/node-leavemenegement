const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authorize = require('../middlewares/authorize');
const profileController = require("../controllers/profileController");

router.get("/user-profile", authorize(['Manager', 'Employee', 'Admin']), profileController.getUserProfileView);

router.post(
  "/upload-profile-picture", 
  authorize(['Manager', 'Employee', 'Admin']),  // Ensure that the user is authorized
  profileController.upload,  // Use the upload middleware for handling file upload
  profileController.uploadProfilePicture // New controller function for saving the uploaded image
);

router.post(
  "/edit-profile", authorize(['Manager', 'Employee', 'Admin']),
  [
    body("firstName").trim().isLength({ min: 1 }).withMessage("First name is required").escape(),
    body("lastName").trim().isLength({ min: 1 }).withMessage("Last name is required").escape(),
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("pinCode").trim().isNumeric().isLength({ min: 5, max:6 }).withMessage("Pincode must be maximum 6 and Min 6 digits").escape(),
  ],
  profileController.editProfile
);


module.exports = router;