const express = require('express');
const expressLayouts = require('express-ejs-layouts'); // middlewear for handle layouts
const indexRouter = require("./routes/index");
const flash = require("connect-flash");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieParser = require('cookie-parser');
const authorize = require('./middlewares/authorize');
const jwt = require('jsonwebtoken');
const path = require('path');


require('dotenv').config();

const App = express();

App.use(express.json());
App.use(bodyParser.json());
App.use(cookieParser());
App.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serving static files from the 'uploads' folder

App.use(
    session({
      secret: "LEAVEMGMTDEMO",
      resave: false,
      saveUninitialized: true,
    })
  );
App.use(flash());

App.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    try {
      const token = req.cookies.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.locals.user = decoded; // Pass user data to all views
      } else {
        res.locals.user = null; // No user data if no token
      }
    } catch (error) {
      console.error("Error decoding token:", error.message);
      res.locals.user = null; // Clear user data on token error
    }
    next();
  });
// Parse URL-encoded request bodies
App.use(express.urlencoded({ extended: true }));
App.use(express.static('public'));

// App layout and views sets
App.set('view engine', 'ejs'); // Set view engine for load HTML pages
App.use(expressLayouts); // use layout package for layout handle



App.use((req, res, next) => {
  if (req.path.startsWith('/user/login')) {
      res.locals.layout = 'loginLayout';
  } else {
      res.locals.layout = 'layout'; // Default layout
  }
  next();
});

// App.set('layout','layout'); // Set default layout file

App.set('views', './views'); // Set folder for get view pages

App.use("/dashboard", indexRouter);

App.use((req, res, next) => {
  res.status(404).render('404', { title: 'Page Not Found' , layout: 'loginLayout'});
});
App.use(authorize);


App.listen("2000");