const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authorize = require('../middlewares/authorize');
const authController = require("../controllers/authController");

router.get("/login", authController.getLoginView);

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

module.exports = router;