
// const i18n = require("i18n");

module.exports = {
  //Controller function to list all the services
  getDepartmentListView: async (req, res) => {
    try {
   
      const departmentData = { name: 'Admin', };
      res.render("department/department-list", { title: 'Department', departmentData: departmentData });
    } catch (error) {
      utils.logError(`${error.status || 500} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${error.message}`);
      res.redirect("/");
    }
  }
}
