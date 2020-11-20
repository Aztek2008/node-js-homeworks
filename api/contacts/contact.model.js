const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const contactSchema = new Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    validate: (value) => value.includes("@"),
    unique: true,
  },
  phone: {
    type: String,
    required: false,
  },
  subscription: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  subscription: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free",
  },
  token: String,
});

contactSchema.statics.findContactByIdAndUpdate = findContactByIdAndUpdate;
contactSchema.statics.findContactByEmail = findContactByEmail;
contactSchema.statics.updateToken = updateToken;

async function findContactByIdAndUpdate(id, updateParams) {
  try {
    return this.findByIdAndUpdate(
      id,
      {
        $set: updateParams,
      },
      {
        new: true,
      }
    );
  } catch (err) {
    next(err);
  }
}

async function findContactByEmail(email) {
  try {
    return this.findOne({
      email,
    });
  } catch (err) {
    next(err);
  }
}

async function updateToken(id, newToken) {
  try {
    return this.findByIdAndUpdate(id, {
      token: newToken,
    });
  } catch (err) {
    next(err);
  }
}

const contactModel = mongoose.model("Contact", contactSchema);

module.exports = contactModel;
