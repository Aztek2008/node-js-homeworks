const fs = require("fs");
const Joi = require("joi");
const uuid = require("uuid");
const path = require("path");
const multer = require("multer");
const sgMail = require("@sendgrid/mail");
const fsPromises = require("fs").promises;

const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const {
  Types: { ObjectId },
} = require("mongoose");
Joi.objectId = require("joi-objectid")(Joi);
const Avatar = require("avatar-builder");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  UnauthorizedError,
  NotFoundError,
} = require("../helpers/errors.constructors");
const userModel = require("./user.model");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const filename = Date.now() + ".jpg";
const destination = "tmp";

class UserController {
  constructor() {
    this._costFactor = 4;
  }

  get createUser() {
    return this._createUser.bind(this);
  }
  get signIn() {
    return this._signIn.bind(this);
  }
  get getCurrentUser() {
    return this._getCurrentUser.bind(this);
  }
  get avatarGenerate() {
    return this._avatarGenerate.bind(this);
  }

  async _createUser(req, res, next) {
    try {
      const { password, email } = req.body;
      const passwordHash = await bcryptjs.hash(password, this._costFactor);
      const PORT = process.env.PORT;

      const existingUser = await userModel.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).send("Email in use");
      }

      const user = await userModel.create({
        email,
        password: passwordHash,
        avatarURL: `http://localhost:${PORT}/public/images/` + filename,
      });

      await this.sendVerificationEmail(user);

      return res.status(201).json({
        user: {
          email: user.email,
          subscription: user.subscription,
          avatarURL: user.avatarURL,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async _signIn(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await userModel.findUserByEmail(email);

      const token = await this.checkUser(email, password);

      return res.status(200).json({
        token,
        user: {
          email,
          subscription: user.subscription,
          avatarURL: user.avatarURL,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  multerMiddlware = () => {
    const storage = multer.diskStorage({
      destination: "tmp",
      filename: function (req, file, cb) {
        const ext = path.parse(file.originalname).ext;
        cb(null, `${Date.now()}${ext}`);
      },
    });
    return multer({ storage });
  };

  async _avatarGenerate(req, res, next) {
    try {
      const randomColor = "#" + (((1 << 24) * Math.random()) | 0).toString(16);
      const randomNum = Math.floor(Math.random() * (12 - 3)) + 3;
      const avatar = Avatar.squareBuilder(
        128,
        randomNum,
        [randomColor, "#ffffff"],
        {
          cache: null,
        }
      );

      const buffer = await avatar.create("gabriel");
      // const destination = "tmp";
      fs.writeFileSync(`${destination}/${filename}`, buffer);
      req.file = { destination, filename, path: `${destination}/${filename}` };
      next();
    } catch (error) {
      console.log(error);
    }
  }

  async imageMini(req, res, next) {
    try {
      // console.log("REQ FILE", req.file);

      const MINI_IMG = "public/images/";
      await imagemin([`${req.file.destination}/*.{jpg,png}`], {
        destination: MINI_IMG,
        plugins: [
          imageminJpegtran(),
          imageminPngquant({
            quality: [0.6, 0.8],
          }),
        ],
      });

      const { filename, path: draftPath } = req.file;
      await fsPromises.unlink(draftPath);

      req.file = {
        ...req.file,
        path: path.join(MINI_IMG, filename),
        destination: MINI_IMG,
      };
      next();
    } catch (err) {
      next(err);
    }
  }

  async checkUser(email, password) {
    try {
      const user = await userModel.findUserByEmail(email);
      if (!user || user.status !== "Verified") {
        throw new UnauthorizedError("Email or password is wrong");
      }

      const isPasswordValid = await bcryptjs.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Email or password is wrong");
      }

      const token = await jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: 2 * 24 * 60 * 60, // two days
        }
      );
      await userModel.updateToken(user._id, token);

      return token;
    } catch (err) {
      console.log(err);
    }
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
      let oldImg = req.user.avatarURL.replace(
        `http://localhost:${PORT}/tmp/`,
        ""
      );
      await fsPromises.unlink(`${destination}/` + oldImg);
      req.body.avatarURL =
        `http://localhost:${PORT}/${destination}/` + req.file.filename;

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

  async verifyEmail(req, res, next) {
    try {
      const { verificationToken } = req.params;

      const userToVerify = await userModel.findByVerificationToken(
        verificationToken
      );

      if (!userToVerify) {
        throw new NotFoundError("User not found");
      }

      await userModel.verifyUser(userToVerify._id);
      console.log("userToVerify._id", userToVerify._id);

      return res.status(200).send("User verified successfully");
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("Not authorized");
      }

      await userModel.updateToken(user._id, null);

      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async authorize(req, res, next) {
    try {
      // 1. витягнути токен користувача з заголовка Authorization
      const authorizationHeader = req.get("Authorization") || "";
      const token = authorizationHeader.replace("Bearer ", "");
      // 2. витягнути id користувача з пейлоада або вернути користувачу помилку зі статус кодом 401
      let userId;
      try {
        userId = await jwt.verify(token, process.env.JWT_SECRET).id;
      } catch (err) {
        next(new UnauthorizedError("Not authorized"));
      }

      // 3. витягнути відповідного користувача. Якщо такого немає - викинути помилку зі статус кодом 401
      const user = await userModel.findById(userId);

      if (!user || user.token !== token) {
        throw new UnauthorizedError("Not authorized");
      }

      // 4. Якщо все пройшло успішно - передати запис користувача і токен в req і передати обробку запиту на наступний middleware
      req.user = user;
      req.token = token;

      next();
    } catch (err) {
      next(err);
    }
  }

  validateId(req, res, next) {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send(`ID ${id} not found`);
    }

    next();
  }

  validateCreateUser(req, res, next) {
    const validationRules = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
      avatarURL: Joi.string(),
    });
    const result = Joi.validate(req.body, validationRules);
    if (result.error) {
      return res.status(400).send(result.error);
    }
    next();
  }

  validateUpdateUser(req, res, next) {
    const validationRules = Joi.object({
      email: Joi.string(),
      password: Joi.string(),
    });
    const result = Joi.validate(req.body, validationRules);
    if (result.error) {
      return res.status(400).send(result.error);
    }
    next();
  }

  validateSignIn(req, res, next) {
    const signInRules = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    const validationResult = Joi.validate(req.body, signInRules);
    if (validationResult.error) {
      return res.status(400).send(validationResult.error.message);
    }

    next();
  }

  prepareUsersResponse(users) {
    return users.map((user) => {
      const { email, subscription, avatarURL } = user;

      return { email, subscription, avatarURL };
    });
  }

  async sendVerificationEmail(user) {
    const verificationToken = uuid.v4();

    await userModel.createVerificationToken(user._id, verificationToken);

    const PORT = process.env.PORT;
    const msg = {
      to: [user.email], // REGISTRATION MAIL
      from: "mail4api2020@gmail.com",
      subject: "VERYFICATION EMAIL",
      html: `<a href='http://localhost:${PORT}/users/auth/verify/${verificationToken}/'>Please verify your e-mail by clicking on this link</a>`,
    };

    await sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

module.exports = new UserController();
