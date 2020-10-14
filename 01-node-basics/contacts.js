const fs = require("fs");
const { promises: fsPromises } = fs;
const path = require("path");

const contactsPath = path.join(__dirname, "./db/contacts.json");

function listContacts() {
  fsPromises.readFile(contactsPath, "utf-8", (err, data) => {
    if (err) {
      throw err;
    }
    console.log("LIST OF CONTACTS:", data);
  });
}

async function getContactById(contactId) {
  try {
    const contacts = await fsPromises.readFile(contactsPath, "utf-8");

    contact = await JSON.parse(contacts).find(
      (contact) => contact.id === contactId
    );
    contactId && console.log(`Contact with id ${contactId}: `, contact);
  } catch (err) {
    console.log("err", err);
  }
}

async function removeContact(contactId) {
  try {
    const contacts = await fsPromises.readFile(contactsPath, "utf-8");

    const stringifyedContacts = await JSON.stringify(
      JSON.parse(contacts).filter((contact) => contact.id !== contactId)
    );

    await fsPromises.writeFile(contactsPath, stringifyedContacts);

    console.log("contacts after rewrite", contacts);
    process.exit(0);
  } catch (error) {
    console.log("error", error);
  }
}

function addContact(name, email, phone) {
  const user = { name: name, email: email, phone: phone };
  fs.appendFile(contactsPath, user, "utf8", (err) => {
    if (err) {
      throw err;
    }
    console.log("USER: ", user);
  });
}

getContactById.exports = {
  getContactById: getContactById(),
};

module.exports = {
  listContacts: listContacts,
  getContactById: getContactById,
  removeContact: removeContact,
  addContact: addContact,
};
// listContacts();
// getContactById(5);
// removeContact(1);
// addContact("Hovard", "hovard@i.com", "390309430493");
