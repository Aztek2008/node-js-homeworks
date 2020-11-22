const fs = require("fs");
const uuid = require("uuid");
const path = require("path");
const multer = require("multer");
const sgMail = require("@sendgrid/mail");
const fsPromises = require("fs").promises;

const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const Avatar = require("avatar-builder");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  UnauthorizedError,
  NotFoundError,
} = require("../helpers/errors.constructors");
const userModel = require("../users/user.model");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const filename = Date.now() + ".jpg";

class AuthController {
  constructor() {
    this._costFactor = 4;
  }

  get createUser() {
    return this._createUser.bind(this);
  }
  get signIn() {
    return this._signIn.bind(this);
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
        avatarURL: `http://localhost:${PORT}/${filename}`,
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
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../public/images"));
      },
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}.png`);
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
      const destination = "tmp";
      fs.writeFileSync(`${destination}/${filename}`, buffer);
      req.file = { destination, filename, path: `${destination}/${filename}` };
      next();
    } catch (error) {
      console.log(error);
    }
  }

  async imageMini(req, res, next) {
    try {
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

      const { filename, path: draftPath, destination } = req.file;

      await fsPromises.unlink(draftPath);

      req.file = {
        ...req.file,
        path: path.join(MINI_IMG, filename),
        destination: MINI_IMG,
      };

      console.log("req.file", req.file);

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

      console.log("token", token);

      await userModel.updateToken(user._id, token);

      return token;
    } catch (err) {
      console.log(err);
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

  async sendVerificationEmail(user) {
    const verificationToken = uuid.v4();

    await userModel.createVerificationToken(user._id, verificationToken);

    const PORT = process.env.PORT;
    const msg = {
      to: [user.email], // REGISTRATION MAIL
      from: "mail4api2020@gmail.com",
      subject: "VERYFICATION EMAIL",
      html: `<a href='http://localhost:${PORT}/auth/auth/verify/${verificationToken}/'>Please verify your e-mail by clicking on this link</a>`,
    };

    await sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent to", user.email);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

module.exports = new AuthController();
