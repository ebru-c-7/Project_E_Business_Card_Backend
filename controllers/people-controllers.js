const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const Person = require("../models/person");
const Card = require("../models/card");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Couldn't sign up. Please try again!", 422));
  }

  const { name, email, password } = req.body;

  let findPerson;
  try {
    findPerson = await Person.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Sign up failed. Please try again!", 500));
  }

  if (findPerson) {
    return next(
      new HttpError("User already exists. Please login instead!", 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Sign up failed. Please try again!", 500));
  }

  const newPerson = new Person({
    name,
    email,
    password: hashedPassword,
    cards: [],
  });

  try {
    newPerson.save();
  } catch (err) {
    return next(new HttpError("Sign up failed. Please try again!", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { pId: newPerson.id, email: newPerson.email },
      process.env.KEY,
      { expiresIn: "3h" }
    );
  } catch (err) {
    return next(new HttpError("Sign up failed. Please try again!", 500));
  }
  console.log("token", token);
  let response = {
    pId: newPerson.id,
    email: newPerson.email,
    token: token,
  };

  res.status(201).json(response);
};

const login = async (req, res, next) => {
  let error;
  const { email, password } = req.body;

  let findPerson;
  try {
    findPerson = await Person.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Login failed. Please try again!", 500));
  }

  if (!findPerson) {
    return next(
      new HttpError("We couldn't find the user. Please sign up!", 401)
    );
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(password, findPerson.password);
  } catch (err) {
    return next(new HttpError("Couldn't log you in. Please try again!", 500));
  }

  if (!isPasswordValid) {
    return next(
      new HttpError("Couldn't log you in, invalid credentials!", 403)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { pId: findPerson.id, email: findPerson.email },
      process.env.KEY,
      { expiresIn: "3h" }
    );
  } catch (err) {
    return next(new HttpError("Log in failed. Please try again!", 500));
  }

  let response = {
    pId: findPerson.id,
    email: findPerson.email,
    token: token,
  };

  res.status(201).json(response);
};

const getCardsByPersonId = async (req, res, next) => {
  const personId = req.params.pId;

  let cards;
  try {
    cards = await Card.find({ creator: personId }).populate("creator");
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Couldn't find any cards!", 500)
    );
  }

  let favcards = []; let person;
  try {
    person = await Person.findById(personId).populate("favcards");
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Couldn't find any cards!", 500)
    );
  }

  for(let favCard of person.favcards) {
    favCard = await Card.findById(favCard.id).populate("creator", "name");
    if(favCard) {favcards.push(favCard);}
  }

  res.json({
    cards: cards.map((card) => card.toObject({ getters: true })),
    favcards: favcards.map((card) => card.toObject({ getters: true })),
    person: person.toObject({getters: true})
  });
};

exports.signup = signup;
exports.login = login;
exports.getCardsByPersonId = getCardsByPersonId;
