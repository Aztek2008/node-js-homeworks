const { Router } = require("express");
const contactController = require("./contact.controller");

const contactRouter = Router();

contactRouter.post(
  "/auth/register",
  contactController.validateCreateContact,
  contactController.createContact
);
contactRouter.post(
  "/auth/login",
  contactController.validateSignIn,
  contactController.signIn
);

contactRouter.post(
  "/auth/logout",
  contactController.authorize,
  contactController.logout
);

contactRouter.get(
  "/current",
  contactController.authorize,
  contactController.getCurrentContact
);

contactRouter.get("/", contactController.getContacts);
contactRouter.get(
  "/:id",
  contactController.validateId,
  contactController.getContactById
);
contactRouter.delete(
  "/:id",
  contactController.validateId,
  contactController.deleteContactById
);

contactRouter.put(
  "/:id",
  contactController.validateId,
  contactController.validateUpdateContact,
  contactController.updateContactById
);

module.exports = contactRouter;
