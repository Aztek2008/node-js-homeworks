const { Router } = require("express");
const express = require("express");
const multer = require("multer");
const path = require("path");
const userController = require("./user.controller");

const userRouter = Router();

userRouter.use(express.static("public/images"));
// http://localhost:3000/users/1605120605096.jpg

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/images/");
//   },
//   filename: function (req, file, cb) {
//     console.log("file", file);
//     const ext = path.parse(file.originalname).ext;
//     cb(null, `${Date.now()}${ext}`);
//   },
// });

// const upload = multer({ storage });

userRouter.post("/profile", userController.multerMiddlware().single("avatar"));

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
