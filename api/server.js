const express = require("express");
const mongoose = require("mongoose");
const contactRouter = require("./contacts/contact.router");
const userRouter = require("./users/user.router");
require("dotenv").config();

module.exports = class UserServer {
  constructor() {
    this.server = null;
  }

  async start() {
    try {
      this.initServer();
      this.initMiddleware();
      this.initRoutes();
      await this.initDataBase();
      this.startListening();
    } catch (err) {
      console.log(err);
    }
  }

  initServer() {
    this.server = express();
  }

  initMiddleware() {
    this.server.use(express.json());
  }

  initRoutes() {
    this.server.use("/users", userRouter);
    this.server.use("/contacts", contactRouter);
    // this.server.use("/tmp", express.static("tmp"));
    this.server.use("/images", express.static("public/images"));
    // http://localhost:3000/users/1605120605096.jpg
  }

  async initDataBase() {
    try {
      await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      });

      return console.log("Database connection successful");
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  }

  startListening() {
    const PORT = process.env.PORT;

    this.server.listen(PORT, () => {
      console.log(`Server start listening on port ${PORT}`);
    });
  }
};
