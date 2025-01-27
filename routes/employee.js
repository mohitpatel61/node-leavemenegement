const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authorize = require('../middlewares/authorize');
const employeeController = require("../controllers/employee");
const multer = require("multer");
const upload = multer({ dest: "uploads/empData/" }); // Specify the upload folder

router.get('/view-emp/:id', authorize('Manager'), employeeController.getEmpDetail);
router.get('/edit-emp/:id', authorize('Manager'), employeeController.getEmpDetail);
router.get("/", authorize('Manager'), employeeController.getEmployeeListView);
router.get('/import-data', authorize('Manager'), employeeController.getEmpImportForm);
router.post("/emp-ajax", authorize('Manager'), employeeController.getAjaxEmployee);


router.get("/add-emp", authorize('Manager'), employeeController.getAddEmpView);

router.post(
  "/add-emp", authorize('Manager'),
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
  employeeController.addEmp
);


router.post(
  "/import-data",
  authorize("Manager"),
  upload.single("excelData"), // Handle single file upload
  employeeController.importEmp
);

router.patch('/delete-emp/:id', authorize(['Manager']), employeeController.deleteEmp);


router.post(
  "/edit-emp", authorize('Manager'),
  [
    body("firstName").trim().isLength({ min: 1 }).withMessage("First name is required").escape(),
    body("lastName").trim().isLength({ min: 1 }).withMessage("Last name is required").escape(),
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    // body("department").trim().isLength({ min: 1 }).withMessage("Department is required").escape(),
  ],
  employeeController.editEmp
);
// router.post("/add-emp", employeeController.addEmp);

module.exports = router;