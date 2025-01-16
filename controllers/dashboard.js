const { where, Op } = require("sequelize");
const {LeaveApplication, Manager, User, EmployeeLeave,LeaveMaster,Department, sequelize, Sequelize} = require("../models");
// const i18n = require("i18n");
module.exports = {
  //Controller function to list all the services
  getDashboardView: async (req, res) => {
    try {
      
      const user = req.user; // Get user from session
    
      if (!user) {
        req.flash("error", "Please log in first.");
        return res.redirect("/user/login");
      }


     // Access decoded user data
     const userId = req.user.id;
     const userRole = req.user.role;
     const userName = req.user.name;
     const userEmail = req.user.email;

    
     let employeeCount = 0;
     let managerCount = 0;
     let totalEmpLeaveReqs = 0;
     let totalManagerLeaveReqs = 0;
     
     let totalHandlerLeaveReqs = 0;
     let totalHandlerPendingLeaveReqs = 0;
     let totalHandlerApprovedLeaveReqs = 0;
     let totalHandlerRejectedLeaveReqs = 0;


      // handler LeaveReqs 
      const whereClauseByRole =  userRole === "Admin" || userRole === "Manager" ? 
          { handled_by : userId } :
          {  user_id : userId  } ;
      const HandendlerReqs = await LeaveApplication.findAll({
        where: whereClauseByRole,
       });
       totalHandlerLeaveReqs += HandendlerReqs.length; // total requests to be handled
      
      // total requsts by status
       await Promise.all(
        HandendlerReqs.map((adminHandler) => {
           if(adminHandler.status === "Pending"){
            totalHandlerPendingLeaveReqs++;
           }
           else if(adminHandler.status === "Approved"){
            totalHandlerApprovedLeaveReqs++;
           }
           else if(adminHandler.status === "Rejected"){
            totalHandlerRejectedLeaveReqs++;
           }
         })
       );


     if (userRole === "Admin") {
       const users = await User.findAll({
         where: { id: { [Op.not]: userId } },
       });
        
       // Map data and count roles
      await Promise.all(
      users.map(async (user) => {
          if (user.role === "Employee") {
            employeeCount++;
            
            // Employee LeaveReqs 
            const empLeaveApplications = await LeaveApplication.count({
              where: {user_id: user.id}
            });
            totalEmpLeaveReqs += empLeaveApplications;
            
          } else if (user.role === "Manager") {
            managerCount++;

             // Manager LeaveReqs 
            const managerLeaveApplications = await LeaveApplication.count({
              where: {user_id: user.id}
            });
            totalManagerLeaveReqs+= managerLeaveApplications;
          }
          return {
            id: user.id,
            role: user.role, // Include the role if needed
          };
        })
       );
       
     } else if (userRole === "Manager") {

      
       const users = await User.findAll({
         where: { created_by: userId, role: "Employee" },
       });
     
       // Use Promise.all to handle async operations
       await Promise.all(
         users.map(async (user) => {
           employeeCount++;
           const empLeaveApplications = await LeaveApplication.count({
             where: { user_id: user.id },
           });
           totalEmpLeaveReqs += empLeaveApplications; // Add leave request count
         })
       );
     }
     
     // Create the response data
     const resData = {
       title: "Dashboard",
       message: "Good Morning, All",
       dashboardData: {
         totalEmps: employeeCount,
         totalManagers: managerCount,
         totalEmpLeaveReqs: totalEmpLeaveReqs,
         totalManagerLeaveReqs: totalManagerLeaveReqs,

         totalHandlerLeaveReqs:totalHandlerLeaveReqs,
         totalHandlerPendingLeaveReqs: totalHandlerPendingLeaveReqs,
         totalHandlerApprovedLeaveReqs: totalHandlerApprovedLeaveReqs,
         totalHandlerRejectedLeaveReqs: totalHandlerRejectedLeaveReqs,
       },
     };
     
     // Return or use the resData as needed
     console.log(resData);
     
      res.render("dashboard", resData);
    } catch (error) {
      res.redirect("/user/login");
    }
  },
}


