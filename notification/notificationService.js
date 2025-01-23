const { getAgServer } = require('../socketConfig/socketManager');
const {LeaveApplication, Manager, User, EmployeeLeave,LeaveMaster,Department, Notification, sequelize, Sequelize} = require("../models");

const sendNotification = async (userSocketId, message) => {
    try {
        const agServer = getAgServer();
        const channel = `notification_${userSocketId}`;
        const totalNotifications = await Notification.count({
            where: {user_id: userSocketId, is_read: 0}
          });
        agServer.exchange.transmitPublish(channel,  { total: totalNotifications }); // use transmitPublish instead Of emit 
        
    } catch (error) {
        console.error('Error sending notification:', error.message);
    }
};

module.exports = { sendNotification };

