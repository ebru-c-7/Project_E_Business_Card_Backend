const express = require("express");
const { check } = require("express-validator");

const peopleControllers = require("../controllers/people-controllers");

const router = express.Router();

router.get("/:pId", peopleControllers.getCardsByPersonId);

router.post(
  "/authenticate/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  peopleControllers.signup
);

router.post("/authenticate/login", peopleControllers.login);

module.exports = router;
