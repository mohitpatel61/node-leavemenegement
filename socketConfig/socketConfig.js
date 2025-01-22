const eetase = require('eetase'); // Wrapper for HTTP server to support WebSockets
const socketClusterServer = require('socketcluster-server');

let options = {
    wsEngine: 'ws',
    authAlgorithm: 'HS256', // Fixing invalid algorithm
    handshakeTimeout: 10000,
    ackTimeout: 20000,
    origins: '*:*',
    pingInterval: 2000,
    pingTimeout: 10000,
    path: '/socketcluster/',
    allowClientPublish: true,
    socketChannelLimit: 1000,
};

const setupSocketServer = (httpServer) => {
    const wrappedServer = eetase(httpServer);

    // Initialize the SocketCluster server
    const agServer = socketClusterServer.attach(wrappedServer, options);
   
    console.log("Socket server initialized");

    // Main WebSocket connection handling loop
    (async () => {
        try {
            // Listen for client connections
            for await (let { socket } of agServer.listener('connection')) {
                console.log('New socket connection:', socket.id);

                // Handle custom events for this socket
                (async () => {
                    for await (let { data } of socket.listener('someEvent')) {
                        console.log('Received someEvent:', data);
                    }
                })();

                // Handle RPC procedures
                (async () => {
                    for await (let request of socket.procedure('customProc')) {
                        if (request.data && request.data.bad) {
                            let badCustomError = new Error('Server failed to execute the procedure');
                            badCustomError.name = 'BadCustomError';
                            request.error(badCustomError);
                            console.log("Sending failed");
                            continue;
                        }
                        console.log("Sending success: " + JSON.stringify(request.data));
                        request.end('Success');
                    }
                })();
            }
        } catch (error) {
            console.error("Error in SocketCluster connection loop:", error);
        }
    })();

    return agServer;
};

module.exports = setupSocketServer;
