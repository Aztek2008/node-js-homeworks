const express = require("express");
const ContactController = require("./contact.controller");

const contactRouter = express.Router();

// @ POST /api/contacts
contactRouter.post(
  "/",
  ContactController.validateCreateContact,
  ContactController.createContact
);

// @ GET /api/contacts
contactRouter.get("/", ContactController.listContacts);

// @ GET /api/contacts/:contactId
contactRouter.get("/:id", ContactController.getContactById);

// @ PATCH /api/contacts/:contactId
contactRouter.put(
  "/:id",
  ContactController.validateUpdateContact,
  ContactController.updateContact
);

// @ DELETE /api/contacts/:contactId
contactRouter.delete("/:id", ContactController.deleteContact);

console.log("contactRouter", contactRouter);

module.exports = contactRouter;
