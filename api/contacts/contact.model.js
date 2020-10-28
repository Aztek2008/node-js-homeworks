const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const schema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    validate: (value) => value.includes("@"),
    unique: true,
  },
  phone: { type: String },
  subscription: { type: String },
  password: { type: String, required: true },
});

schema.statics.findContactByIdAndUpdate = findContactByIdAndUpdate;

async function findContactByIdAndUpdate(id, updateParams) {
  return this.findByIdAndUpdate(
    id,
    {
      $set: updateParams,
    },
    {
      new: true,
    }
  );
}

const model = mongoose.model("Contact", schema);

module.exports = model;
