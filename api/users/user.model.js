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
  token: { type: String, required: false },
  verificationToken: { type: String, required: false },
  status: {
    type: String,
    required: true,
    enum: ["Verified", "Created"],
    default: "Created",
  },
});

userSchema.statics.createVerificationToken = createVerificationToken;
userSchema.statics.findByVerificationToken = findByVerificationToken;
userSchema.statics.findUserByIdAndUpdate = findUserByIdAndUpdate;
userSchema.statics.findUserByEmail = findUserByEmail;
userSchema.statics.updateToken = updateToken;
userSchema.statics.verifyUser = verifyUser;

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

async function createVerificationToken(userId, verificationToken) {
  return this.findByIdAndUpdate(userId, { verificationToken }, { new: true });
}

async function findByVerificationToken(verificationToken) {
  return this.findOne({ verificationToken });
}

async function verifyUser(userId) {
  return this.findByIdAndUpdate(
    userId,
    { status: "Verified", verificationToken: null },
    { new: true }
  );
}

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;

/**
 * VERIFICATION PATH:
 * ADD VERIFICATION STATUS & VERIFICATION TOKEN IN USER MODEL
 * CREATE USER FUNCTION -> SEND VERIFICATION EMAIL
 * CREATE VERIFICATION FUNCTION (VF) IN USER SCHEMA
 * IN CONTROLLER'S VERIFICATION EMAIL WE CREATE VERIFICATION TOKEN AND PASS TO VF
 * WHILE REGISTER NEW USER SEND USER DATA WITH VTOKEN TO DB
 * AND EMAIL TO REGISTRATION ADDRESS WITH VERIFY LINK
 * BY CLICKING THIS LINK CHANGE STSTUS IN MODEL AND REMOVE VERIFTOKEN IF MATCH
 * ADD STATUS CHECK WHILE SIGN-IN
 *
 */
