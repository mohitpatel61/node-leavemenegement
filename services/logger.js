const winston = require('winston');

// Function to create a logger dynamically with given log level and file name
const createLogger = (level = 'info', filename = 'default.log') => {
  return winston.createLogger({
    level: level,
    transports: [
      new winston.transports.File({ filename: filename })
    ]
  });
};

// Function to log a message with dynamic level and file
const logMessage = (level, filename, message) => {
  const logger = createLogger(level, filename); // Create logger with dynamic level and file name
  logger[level](message); // Log the message with the specified level
};

// Export the log function for use in other parts of your application
module.exports = { logMessage };
