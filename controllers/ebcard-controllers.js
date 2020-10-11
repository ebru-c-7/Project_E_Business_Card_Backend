const { validationResult } = require("express-validator");
const fs = require("fs");

const HttpError = require("../models/http-error");
const Person = require("../models/person");
const Card = require("../models/card");
const mongoose = require("mongoose");

const createCard = async (req, res, next) => {
  const mainEmail = req.params.email;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Please check your input!", 422));
  }

  const {
    position,
    company, 
    location,
    email,
    tel,
    linkedin,
    twitter,
    facebook,
    instagram,
    slogan,
  } = req.body;

  let image;
  try {
    image = req.file.path;
  } catch(err) {
    image = "";
  }

  const createdCard = new Card({
    position,
    company,
    location,
    email,
    tel,
    linkedin,
    twitter,
    facebook,
    instagram,
    slogan,
    active: true,
    logoImg: image,
    creator: req.personData.pId,
  });

  let person;
  try {
    person = await Person.findOne({ email: mainEmail });
  } catch (err) {
    return next(
      new HttpError("Creating a new card failed. Please try again!", 500)
    );
  }

  if (!person) {
    return next(new HttpError("User not found!", 404));
  }
  if (person.cards.length == 5) {
    return next(
      new HttpError(
        "You cannot register more than 5 cards. Delete a few and try again!",
        422
      )
    );
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdCard.save({ session: sess });
    person.cards.push(createdCard);
    await person.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("Creating a new card has failed!", 500));
  }
  res.status(201).json({ card: createdCard.toObject({ getters: true }) });
};

const getCards = async (req, res, next) => {
  let cards;
  try {
    cards = await Card.find().populate("creator", "name");
  } catch (err) {
    return next(new HttpError("Fetching cards failed!", 500));
  }

  if (!cards || cards.length === 0) {
    return next(new HttpError("We looked, but couldn't find any card :(", 404));
  }

  cards = cards.filter(card => card.active);

  res.json({ cards: cards.map((card) => card.toObject({ getters: true })) });
};

const getCardById = async (req, res, next) => {
  const cardId = req.params.ecid;

  let card;
  try {
    card = await Card.findById(cardId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Couldn't find the card!", 500)
    );
  }

  if (!card) {
    return next(new HttpError("We looked, but couldn't find the card :(", 404));
  }

  res.json({ card: card.toObject({ getters: true }) });
};

const deleteCard = async (req, res, next) => {
  const cardId = req.params.ecid;

  let card;
  try {
    card = await Card.findById(cardId).populate("creator");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, the card couldn't be deleted!", 500)
    );
  }

  if (!card) {
    return next(new HttpError("We couldn't find the card!", 404));
  }

  if (card.creator.id !== req.personData.pId) {
    return next(new HttpError("Not allowed operation", 401));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await card.remove({ session: sess });
    card.creator.cards.pull(card);
    await card.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, couldn't finish updating!", 500)
    );
  }

  let imagePath;
  if (card.logoImg) {
    imagePath = card.logoImg;
    fs.unlink(imagePath, (err) => console.log(err));
  }

  res.status(200).json({ message: "Deletion completed!" });
};

const updateCard = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Please check your input!", 422));
  }

  const cardId = req.params.ecid;

  const {
    position,
    company,
    location,
    email,
    tel,
    linkedin,
    twitter,
    facebook,
    instagram,
    slogan,
  } = req.body;

  let card;
  try {
    card = await Card.findById(cardId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't update!", 500)
    );
  }

  if (card.creator.toString() !== req.personData.pId) {
    return next(new HttpError("Not allowed operation", 401));
  }

 
    card.position = position;
    card.company = company;
    card.location = location;
    card.email = email;
    card.tel = tel;
    card.linkedin = linkedin;
    card.twitter = twitter;
    card.facebook = facebook;
    card.instagram = instagram;
    card.slogan = slogan;
    
  try {
    await card.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't finish updating!", 500)
    );
  }

  res.status(200).json({ card: card.toObject({ getters: true }) });
};

const updateStatus = async (req, res, next) => {
  const cardId = req.params.ecid;
  let card;
  try {
    card = await Card.findById(cardId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't update!", 500)
    );
  }

  if (card.creator.toString() !== req.personData.pId) {
    return next(new HttpError("Not allowed operation", 401));
  } else {
    card.active = !card.active;
  }

  try {
    await card.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't finish updating!", 500)
    );
  }

  res.status(200).json({ card: card.toObject({ getters: true }) });
};

const addFavCard = async (req, res, next) => {
  const cardId = req.params.ecid;

  let card;
  try {
    card = await Card.findById(cardId).populate("creator", "name");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't find the card!", 500)
    );
  }

  if (!card) {
    return next(new HttpError("We couldn't find the card!", 404));
  }
 
  let person;
  try {
    person = await Person.findById(req.personData.pId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't find the user!", 500)
    );
  }

  if (!person) {
    return next(new HttpError("User not found!", 404));
  }

  try {
    person.favcards.push(card);
    await person.save();
  } catch (err) {
    return next(new HttpError("The process failed. Please try again!", 500));
  }
  res.status(201).json({ card: card.toObject({ getters: true }) });
};

const removeFavCard = async (req, res, next) => {
  const cardId = req.params.ecid;

  let person;
  try {
    person = await Person.findById(req.personData.pId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't find the user!", 500)
    );
  }

  if (!person) {
    return next(new HttpError("User not found!", 404));
  }

  if(person.favcards.indexOf(cardId) < 0) {
    return next(new HttpError("The card is not on favorites!", 404));
  }

  let card;
  try {
    card = await Card.findById(cardId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, we couldn't find the card!", 500)
    );
  }

  if (!card) {
    return next(new HttpError("We couldn't find the card!", 404));
  }
 
  try {
    person.favcards.pull(card);
    await person.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, couldn't finish updating!", 500)
    );
  }

  res.status(201).json({ card: card.toObject({ getters: true }) });
};

exports.createCard = createCard;
exports.getCards = getCards;
exports.getCardById = getCardById;
exports.deleteCard = deleteCard;
exports.updateCard = updateCard;
exports.updateStatus = updateStatus;
exports.addFavCard = addFavCard;
exports.removeFavCard = removeFavCard;
