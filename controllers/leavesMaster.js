const {leaves} = require("../models");

module.exports = {
    getLeavesList: async (req, resp) => {
        try {
            // const leavesData = [{ name: 'CL' },{ name: 'PL' },{ name: 'SL' },{ name: 'Vacation' }];
            const leavesData = await leaves.findAll();

            resp.render('leaves_master/leave-list', { title: 'Leaves', leavesData: leavesData });
        } catch (error){
            console.log(error.message)

            // utils.logError(`${error.status || 500} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${error.message}`);
            // res.redirect("/");
        }
    },
};