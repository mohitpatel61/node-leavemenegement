const setupSocketServer = require('../socketConfig/socketConfig');
let agServer = null;

const initializeSocketServer = (server) => {
    if (!agServer) {
        agServer = setupSocketServer(server);
        console.log('agServer initialized:');
    }
    return agServer;
};

const getAgServer = () => {
    if (!agServer) {
        throw new Error('agServer has not been initialized. Call initializeSocketServer() first.');
    }
    return agServer;
};

module.exports = { initializeSocketServer, getAgServer };
