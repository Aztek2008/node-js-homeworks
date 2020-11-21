const { Router } = require("express");
const authController = require("./auth.controller");
const authValidator = require("./auth.validator");

const authRouter = Router();

authRouter.post(
  "/auth/register",
  authValidator.validateCreateUser,
  authController.avatarGenerate,
  authController.imageMini,
  authController.createUser
);

authRouter.post(
  "/auth/login",
  authValidator.validateSignIn,
  authController.signIn
);

authRouter.post(
  "/auth/logout",
  authController.authorize,
  authController.logout
);

authRouter.get("/auth/verify/:verificationToken", authController.verifyEmail);

module.exports = authRouter;
