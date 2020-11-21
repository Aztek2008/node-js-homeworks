const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const {
  Types: { ObjectId },
} = require("mongoose"); // REMOVE AS VALIDATE ID MOVED TO HELPERS

class AuthValidator {
  constructor() {}

  // MOVE TO HELPER ???
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
}

module.exports = new AuthValidator();
