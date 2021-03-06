const { Router } = require("express");
const userController = require("./user.controller");

const userRouter = Router();

userRouter.post("/profile", userController.multerMiddlware().single("avatar"));

userRouter.post(
  "/auth/register",
  userController.validateCreateUser,
  userController.avatarGenerate, // ISSUE WITH STATIC PREFIX TO FUNCTION
  userController.imageMini, // ISSUE WITH STATIC PREFIX TO FUNCTION
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

userRouter.get("/auth/verify/:verificationToken", userController.verifyEmail);

userRouter.delete(
  "/:id",
  userController.validateId,
  userController.deleteUserById
);

userRouter.patch(
  "/avatars",
  userController.authorize,
  userController.multerMiddlware().single("avatar"),
  userController.imageMini,
  userController.updateUserById
);

userRouter.put(
  "/:id",
  userController.validateId,
  userController.validateUpdateUser,
  userController.updateUserById
);

module.exports = userRouter;
