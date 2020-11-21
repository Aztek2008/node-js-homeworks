const fsPromises = require("fs").promises;
const fs = require("fs");
const userModel = require("./user.model");
require("dotenv").config();

const destination = "tmp";
const PORT = process.env.PORT;

class UserController {
  constructor() {
    this._costFactor = 4;
  }

  get getCurrentUser() {
    return this._getCurrentUser.bind(this);
  }

  async getUsers(req, res, next) {
    try {
      const users = await userModel.find();
      return res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const userId = req.params.id;
      const user = await userModel.findById(userId);

      if (!user) {
        return res.status(404).send("No users by your request");
      }

      return res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async deleteUserById(req, res, next) {
    try {
      const userId = req.params.id;

      const deletedUser = await userModel.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).send("No users by your request");
      }
      return res.status(204).send(`User ${deletedUser.name} deleted`); // DOES NOT LOG TEXT...
    } catch (err) {
      next(err);
    }
  }

  async updateUserById(req, res, next) {
    try {
      req.body.avatarURL = `http://localhost:${PORT}/public/images/${req.file.filename}`;

      const updatingUser = await userModel.findUserByIdAndUpdate(
        req.user._id,
        req.body
      );

      if (!updatingUser) {
        return res.status(404).send("No users by your request");
      }

      return res.status(204).send(
        `User updated ` // DOES NOT LOG TEXT...
      );
    } catch (err) {
      next(err);
    }
  }

  async _getCurrentUser(req, res, next) {
    try {
      const [userForResponse] = this.prepareUsersResponse([req.user]);

      return res.status(200).json(userForResponse);
    } catch (err) {
      next(err);
    }
  }

  prepareUsersResponse(users) {
    return users.map((user) => {
      const { email, subscription, avatarURL } = user;

      return { email, subscription, avatarURL };
    });
  }
}

module.exports = new UserController();
