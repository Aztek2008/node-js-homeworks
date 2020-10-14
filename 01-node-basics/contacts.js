const fs = require("fs");
const { promises: fsPromises } = fs;
const path = require("path");
const contactsPath = path.join(__dirname, "./db/contacts.json");

async function listContacts() {
  try {
    contacts = await fsPromises.readFile(contactsPath, "utf-8");
    console.table(JSON.parse(contacts));
  } catch (err) {
    console.log("err", err);
  }
}

async function getContactById(contactId) {
  try {
    contacts = await fsPromises.readFile(contactsPath, "utf-8");

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
    contacts = await fsPromises.readFile(contactsPath, "utf-8");
    contact = await JSON.parse(contacts).find(
      (contact) => contact.id === contactId
    );

    stringifyedContacts = await JSON.stringify(
      JSON.parse(contacts).filter((contact) => contact.id !== contactId)
    );

    await fsPromises.writeFile(contactsPath, stringifyedContacts);

    console.log("Removed contact: ", contact);
  } catch (error) {
    console.log("error", error);
  }
}

async function addContact(name, email, phone) {
  try {
    contacts = await fsPromises.readFile(contactsPath, "utf-8");
    contact = await {
      id: contacts.length + 1,
      name: name,
      email: email,
      phone: phone,
    };

    parsedContacts = await JSON.parse(contacts);
    await parsedContacts.push(contact);
    await fsPromises.writeFile(contactsPath, JSON.stringify(parsedContacts));

    console.log("Added contact: ", contact);
  } catch (err) {
    console.log("err", err);
  }
}

module.exports = {
  listContacts: listContacts,
  getContactById: getContactById,
  removeContact: removeContact,
  addContact: addContact,
};
