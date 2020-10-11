const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const personSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  password: { type: String, required: true, minlength: 6 },
  cards: [{ type: mongoose.Types.ObjectId, required: true, ref: "Card" }],
  favcards: [{ type: mongoose.Types.ObjectId, required: true, ref: "Card" }],  
});

personSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Person", personSchema, 'people');
