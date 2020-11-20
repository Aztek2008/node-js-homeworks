const Joi = require("joi");
const model = require("./contact.model");
const {
  Types: { ObjectId },
} = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  UnauthorizedError,
  NotFoundError,
} = require("../helpers/errors.constructors");
Joi.objectId = require("joi-objectid")(Joi);

class ContactController {
  constructor() {
    this._costFactor = 4;
  }

  get createContact() {
    return this._createContact.bind(this);
  }
  get signIn() {
    return this._signIn.bind(this);
  }
  get getCurrentContact() {
    return this._getCurrentContact.bind(this);
  }

  async _createContact(req, res, next) {
    try {
      const { password, email } = req.body;
      const passwordHash = await bcryptjs.hash(password, this._costFactor);

      const existingContact = await contactModel.findContactByEmail(email);
      if (existingContact) {
        return res.status(409).send("Email in use");
      }

      const contact = await contactModel.create({
        email,
        password: passwordHash,
      });

      return res.status(201).json({
        user: {
          email: contact.email,
          subscription: contact.subscription,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async _signIn(req, res, next) {
    try {
      const { email, password } = req.body;
      const contact = await contactModel.findContactByEmail(email);

      const token = await this.checkContact(email, password);

      return res.status(200).json({
        token,
        user: {
          email,
          subscription: contact.subscription,
        },
      });
      // const contact = await model.create(req.body);
      // return res.status(201).send(`Contact ${contact.name} created`);
    } catch (err) {
      next(err);
    }
  }

  async checkContact(email, password) {
    try {
      const contact = await contactModel.findContactByEmail(email);
      if (!contact) {
        throw new UnauthorizedError("Email or password is wrong");
      }

      const isPasswordValid = await bcryptjs.compare(
        password,
        contact.password
      );
      if (!isPasswordValid) {
        throw new UnauthorizedError("Email or password is wrong");
      }

      const token = await jwt.sign(
        {
          id: contact._id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: 2 * 24 * 60 * 60, // two days
        }
      );
      await contactModel.updateToken(contact._id, token);

      return token;
    } catch (err) {
      next(err);
    }
  }

  async getContacts(req, res, next) {
    try {
      const contacts = await model.find();
      return res.status(200).json(contacts);
    } catch (err) {
      next(err);
    }
  }

  async getContactById(req, res, next) {
    try {
      const id = req.params.id;
      const contact = await model.findById(id);

      if (!contact) {
        return res.status(404).send("No contacts by your request");
      }

      return res.status(200).json(contact);
    } catch (err) {
      next(err);
    }
  }

  async deleteContactById(req, res, next) {
    try {
      const id = req.params.id;

      const deletedContact = await model.findByIdAndDelete(id);

      if (!deletedContact) {
        return res.status(404).send("No contacts by your request");
      }
      return res.status(204).send(`Contact ${deletedContact.name} deleted`); // DOES NOT LOG TEXT...
    } catch (err) {
      next(err);
    }
  }

  async updateContactById(req, res, next) {
    try {
      const id = req.params.id;

      const updatingContact = await model.findContactByIdAndUpdate(
        id,
        req.body
      );

      if (!updatingContact) {
        return res.status(404).send("No contacts by your request");
      }

      return res.status(204).send(
        `Contact ${updatingContact.name} updated with ${req.body}` // DOES NOT LOG TEXT...
      );
    } catch (err) {
      next(err);
    }
  }

  async _getCurrentContact(req, res, next) {
    try {
      const [contactForResponse] = this.prepareContactsResponse([req.user]);

      return res.status(200).json(contactForResponse);
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

      await contactModel.updateToken(user._id, null);

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
      const user = await contactModel.findById(userId);

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

  validateCreateContact(req, res, next) {
    const validationRules = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string(),
      subscription: Joi.string(),
      password: Joi.string().required(),
    });
    const result = Joi.validate(req.body, validationRules);
    if (result.error) {
      return res.status(400).send(result.error);
    }
    next();
  }

  validateUpdateContact(req, res, next) {
    const validationRules = Joi.object({
      name: Joi.string(),
      email: Joi.string(),
      phone: Joi.string(),
      subscription: Joi.string(),
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

  prepareContactsResponse(contacts) {
    return contacts.map((contact) => {
      const { email, subscription } = contact;

      return {
        email,
        subscription,
      };
    });
  }
}

module.exports = new ContactController();
