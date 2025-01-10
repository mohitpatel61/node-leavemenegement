const jwt = require('jsonwebtoken');


// Middleware to check for role-based access
const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    console.log("Cookies:", req.cookies);// Log the cookies to check if token is present
    const token = req.cookies.token;
    console.log("Token from Cookies:", token); // Debugging log

    if (!token) {
      req.flash("error", "Login again .....");
      return res.redirect('/mp/login');
      // return res.status(403).json({ error: "No token provided" });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Check if the user has the correct role
      if (!roles.includes(decoded.role)) {
        req.flash("error", `Access denied for role: ${decoded.role}`);
        return res.redirect('/dashboard');
      }

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      req.flash("error", "Login again .....");
      return res.redirect('/mp/login');
    }
  };
};

module.exports = authorize;
