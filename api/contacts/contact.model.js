const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const contactSchema = new Schema({
  contactname: { type: String, required: true },
  email: {
    type: String,
    required: true,
    validate: (value) => value.includes("@"),
    unique: true,
  },
  password: { type: String, required: true },
});

contactSchema.statics.findContactByIdAndUpdateHim = findContactByIdAndUpdateHim;

async function findContactByIdAndUpdateHim(contactId, updateParams) {
  return this.findByIdAndUpdate(
    contactId,
    {
      $set: updateParams,
    },
    {
      new: true,
    }
  );
}

const contactModel = mongoose.model("Contact", contactSchema);

module.exports = contactModel;
