const Joi = require("joi");

const contacts = [
  {
    name: "Richard",
    email: "richard@email.com",
    phone: "0503332211",
    id: 1,
  },
  {
    name: "Hovard",
    email: "Hovard@email.com",
    phone: "0505552211",
    id: 2,
  },
  {
    name: "Boy",
    email: "boy@email.com",
    phone: "0675552211",
    id: 3,
  },
];

class ContactController {
  get createContact() {
    return this._createContact.bind(this);
  }

  get updateContact() {
    return this._updateContact.bind(this);
  }

  get deleteContact() {
    return this._deleteContact.bind(this);
  }

  listContacts(req, res, next) {
    return res.json(contacts);
  }

  getContactById(req, res, next) {
    const ID = parseInt(req.params.id);
    const targetContactIndex = contacts.findIndex(
      (contact) => contact.id === ID
    );

    if (targetContactIndex === -1) {
      return res.status(404).send("User not found");
    }

    return res.json(contacts[ID]);
  }

  getById(res, contactId) {
    const id = parseInt(contactId);

    const targetContactIndex = contacts.findIndex(
      (contact) => contact.id === id
    );
    if (targetContactIndex === -1) {
      return res.status(404).send("Not found");
    }

    return targetContactIndex;
  }

  _createContact(req, res, next) {
    const newContact = {
      ...req.body,
      id: contacts.length + 1,
    };

    contacts.push(newContact);

    console.log("contacts", contacts);

    return res.send("Contact created");
  }

  async _updateContact(req, res, next) {
    try {
      const targetContactIndex = this.getById(res, req.params.id);

      contacts[targetContactIndex] = {
        ...contacts[targetContactIndex],
        ...req.body,
      };

      console.log("contacts", contacts);

      return res.status(200).send();
    } catch (err) {
      return res.status(404).send("Not found");
    }
  }

  async _deleteContact(req, res, next) {
    try {
      const targetContactIndex = this.getById(res, req.params.id);

      contacts.splice(targetContactIndex, 1);

      console.log("contacts", contacts);

      return res.status(201).send("Contact deleted");
    } catch (err) {
      return res.status(404).send("Not found");
    }
  }

  validateCreateContact(req, res, next) {
    const createContactRules = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string().required(),
    });

    const result = Joi.validate(req.body, createContactRules);
    if (result.error) {
      return res.status(400).send("Missing required name field");
    }

    next();
  }

  validateUpdateContact(req, res, next) {
    const updateContactRules = Joi.object({
      name: Joi.string(),
      email: Joi.string(),
      phone: Joi.string(),
    });

    const result = Joi.validate(req.body, updateContactRules);
    if (result.error) {
      return res.status(400).send(result.error);
    }

    next();
  }
}

module.exports = new ContactController();
