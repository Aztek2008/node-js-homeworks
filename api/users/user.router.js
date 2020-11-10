const { Router } = require("express");
const userController = require("./user.controller");

const userRouter = Router();

userRouter.post(
  "/auth/register",
  userController.validateCreateUser,
  userController.createUser
);
userRouter.post(
  "/auth/login",
  userController.validateSignIn,
  userController.signIn
);

userRouter.post(
  "/auth/logout",
  userController.authorize,
  userController.logout
);

userRouter.get(
  "/current",
  userController.authorize,
  userController.getCurrentUser
);

userRouter.get("/", userController.getUsers);

userRouter.get("/:id", userController.validateId, userController.getUserById);

userRouter.delete(
  "/:id",
  userController.validateId,
  userController.deleteUserById
);

userRouter.put(
  "/:id",
  userController.validateId,
  userController.validateUpdateUser,
  userController.updateUserById
);

module.exports = userRouter;