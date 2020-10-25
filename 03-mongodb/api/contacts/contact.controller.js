const Joi = require("joi");
const contactModel = require("./contact.model");
const {
  Types: { ObjectId },
} = require("mongoose");
Joi.objectId = require("joi-objectid")(Joi);

class ContactController {
  async createContact(req, res, next) {
    try {
      const contact = await contactModel.create(req.body);

      return res.status(201).send(`Contact ${contact.contactname} created`);
    } catch (err) {
      next(err);
    }
  }

  async getContacts(req, res, next) {
    try {
      const contacts = await contactModel.find();
      return res.status(200).json(contacts);
    } catch (err) {
      next(err);
    }
  }

  async getContactById(req, res, next) {
    try {
      const contactId = req.params.id;
      const contact = await contactModel.findById(contactId);

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
      const contactId = req.params.id;

      const deletedContact = await contactModel.findByIdAndDelete(contactId);

      if (!deletedContact) {
        return res.status(404).send("No contacts by your request");
      }
      return res
        .status(204)
        .send(`Contact ${deletedContact.contactname} deleted`); // DOES NOT LOG TEXT...
    } catch (err) {
      next(err);
    }
  }

  async updateContactById(req, res, next) {
    try {
      const contactId = req.params.id;

      const updatingContact = await contactModel.findContactByIdAndUpdateHim(
        contactId,
        req.body
      );

      if (!updatingContact) {
        return res.status(404).send("No contacts by your request");
      }

      return res.status(204).send(
        `Contact ${updatingContact.contactname} updated with ${req.body}` // DOES NOT LOG TEXT...
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
      contactname: Joi.string().required(),
      email: Joi.string().required(),
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
      contactname: Joi.string(),
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

module.exports = new ContactController();
