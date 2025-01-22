require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts'); // Middleware for handling layouts
const indexRouter = require("./routes/index");
const flash = require("connect-flash");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
const authorize = require('./middlewares/authorize');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const eetase = require('eetase');
const { initializeSocketServer } = require('./socketConfig/socketManager');

const App = express();
const server = http.createServer(App); // Use the same server instance for HTTP and WebSocket


// Middleware Setup
App.use(express.json());
App.use(bodyParser.json());
App.use(cookieParser());
App.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serving static files from the 'uploads' folder

App.use(
  session({
    secret: 'LEAVEMGMTDEMO',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production if using https
  })
);

App.use(flash());

App.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

App.use((req, res, next) => {
  try {
    const user = req.session.user;
    res.locals.user = user || null;
  } catch (error) {
    console.error("Error decoding token:", error.message);
    res.locals.user = null; // Clear user data on token error
  }
  next();
});

// Parse URL-encoded request bodies
App.use(express.urlencoded({ extended: true }));
App.use(express.static('public'));

// Set up EJS and Layouts
App.set('view engine', 'ejs');
App.use(expressLayouts);

// Layout logic for specific paths
App.use((req, res, next) => {
  res.locals.layout = req.path.startsWith('/user/login') ? 'loginLayout' : 'layout';
  next();
});

App.set('views', './views'); // Set folder for views

// Routes Setup
App.use("/", indexRouter);
App.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found', layout: 'loginLayout' });
});

App.use(authorize);

// Use eetase with the same server
const agServer = initializeSocketServer(server);
module.exports = { agServer };


// Start the server
const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`Server running with WebSocket on http://localhost:${PORT}`);
});
