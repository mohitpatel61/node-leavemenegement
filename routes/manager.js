const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const managerController = require("../controllers/manager");
const authorize = require('../middlewares/authorize');

router.get('/view-manager/:id',authorize('Admin'), managerController.getManagerDetail);
router.get('/edit-manager/:id',authorize('Admin'), managerController.getManagerDetail);

router.get("/",authorize('Admin'), managerController.getManagerListView);
router.post("/manager-ajax",authorize('Admin'), managerController.getAjaxManager);

router.get("/add-manager",authorize('Admin'), managerController.addManagerView);
router.post(
    "/add-manager",authorize('Admin'),
    [
      body("firstName").trim().isLength({ min: 1 }).withMessage("First name is required").escape(),
      body("lastName").trim().isLength({ min: 1 }).withMessage("Last name is required").escape(),
      body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
      body("password").trim().isLength({ min: 1 }).withMessage("Password is required").escape(),
      body("passwordConfirm")
        .trim()
        .isLength({ min: 1 })
        .withMessage("Confirm Password is required")
        .escape()
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error("Passwords do not match");
          }
          return true;
      }),
    ],
    managerController.addManager
  );

router.patch('/delete-manager/:id', authorize(['Admin']), managerController.deleteManager);

router.post(
"/edit-manager", authorize('Admin'),
[
    body("firstName").trim().isLength({ min: 1 }).withMessage("First name is required").escape(),
    body("lastName").trim().isLength({ min: 1 }).withMessage("Last name is required").escape(),
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
],
managerController.editManager
);

module.exports = router;