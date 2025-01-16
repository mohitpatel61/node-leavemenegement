// Middleware to check for role-based access using sessions
const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    // console.log("Session User:", req.session.user); // Log session to check if user is authenticated
    const user = req.session.user; // Get user from session
    console.log("Session data:", user);
    if (!user) {
      req.flash("error", "Login again .....");
      return res.redirect('/user/login');
    }

    // Check if the user has the correct role
    if (roles.length > 0 && !roles.includes(user.role)) {
      req.flash("error", `Access denied for role: ${user.role}`);
      return res.redirect('/dashboard');
    }

    req.user = user; // Store user in the request object for later use
    next(); // Proceed to next middleware or route handler
  };
};

module.exports = authorize;
