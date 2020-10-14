const yargs = require("yargs");
const method = require("./contacts");

// console.log("CONTACTS", contacts.getContactById(1));
// console.log("CONTACTS", contacts.removeContact(2));
// console.log(
//     contacts.addContact("Gubert Gubert", "hovard@i.com", "390309430493")
// );

// const methodContacts = require("./contacts.js");

const argv = yargs
  .string("action")
  .number("id")
  .string("name")
  .string("email")
  .string("phone").argv;

function callAction({ action, id, name, email, phone }) {
  switch (action) {
    case "list":
      method.listContacts();
      break;

    case "getById":
      method.getContactById(id);
      break;

    case "remove":
      method.removeContact(id);
      break;

    case "add":
      method.addContact(name, email, phone);
      break;

    default:
      console.warn("\x1B[31m Unsupported operation!");
  }
}

callAction(argv);
