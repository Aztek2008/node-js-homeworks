const Joi = require("joi");
const model = require("./contact.model");
const {
  Types: { ObjectId },
} = require("mongoose");
Joi.objectId = require("joi-objectid")(Joi);

class ContactController {
  async createContact(req, res, next) {
    try {
      const contact = await model.create(req.body);

      return res.status(201).send(`Contact ${contact.name} created`);
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
}

module.exports = new ContactController();
