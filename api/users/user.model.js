const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const userSchema = new Schema({
  // name: { type: String, required: false },
  email: {
    type: String,
    required: true,
    validate: (value) => value.includes("@"),
    unique: true,
  },
  password: { type: String, required: true },
  avatarURL: { type: String, required: false },
  subscription: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free",
  },
  token: String,
});

userSchema.statics.findUserByIdAndUpdate = findUserByIdAndUpdate;
userSchema.statics.findUserByEmail = findUserByEmail;
userSchema.statics.updateToken = updateToken;

async function findUserByIdAndUpdate(userId, updateParams) {
  try {
    return this.findByIdAndUpdate(
      userId,
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

async function findUserByEmail(email) {
  try {
    return this.findOne({ email });
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

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
