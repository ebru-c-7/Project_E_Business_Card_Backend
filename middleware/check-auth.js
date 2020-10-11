const jwt = require("jsonwebtoken");

const HttpError = require("./../models/http-error");

const checkAuth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      throw new Error("Authentication failed!");
    }
    const decodedToken = jwt.verify(token, "project-e-business-cards");
    req.personData = { pId: decodedToken.pId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication failed!!", 403));
  }
};

module.exports = checkAuth;
