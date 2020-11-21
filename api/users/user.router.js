const { Router } = require("express");
const userController = require("./user.controller");
const authController = require("../auth/auth.controller");

const authValidator = require("../auth/auth.validator");

const userRouter = Router();

userRouter.get(
  "/current",
  authController.authorize,
  userController.getCurrentUser
);

userRouter.get("/", userController.getUsers);

userRouter.get("/:id", authValidator.validateId, userController.getUserById);

userRouter.delete(
  "/:id",
  authValidator.validateId,
  userController.deleteUserById
);

userRouter.patch(
  "/avatars",
  authController.authorize,
  authController.multerMiddlware().single("avatar"),
  authController.imageMini,
  userController.updateUserById
);

userRouter.put(
  "/:id",
  authValidator.validateId,
  authValidator.validateUpdateUser,
  userController.updateUserById
);

module.exports = userRouter;
