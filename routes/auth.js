const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authorize = require('../middlewares/authorize');
const authController = require("../controllers/authController");

router.get("/login", authController.getLoginView);
router.get("/change-password", authController.getChangePasswordView);
router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").trim().isLength({ min: 1 }).withMessage("Password is required").escape(),
  ],
  authController.userLogin
);

router.get(
  "/logout", authorize(['Manager', 'Employee', 'Admin']),
  authController.logout
);

router.post(
  "/change-password",
  [
    body("currentPassword").trim().isLength({ min: 1 }).withMessage("Current password is required").escape(),
    body("newPassword").trim().isLength({ min: 1 }).withMessage("New password is required").escape(),
    body("confirmPassword")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Confirm Password is required")
    .escape()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  authController.changePassword
);
module.exports = router;