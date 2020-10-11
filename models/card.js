const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CardSchema = new Schema({
  position: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  email: { type: String, required: true },
  tel: { type: String, required: true },
  linkedin: { type: String },
  twitter: { type: String },
  facebook: { type: String },
  instagram: { type: String },
  logoImg: { type: String, default: "uploadsimageslogo.png" },
  slogan: { type: String },
  active: {type: Boolean},
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "Person" },
});

module.exports = mongoose.model("Card", CardSchema, 'cards');
