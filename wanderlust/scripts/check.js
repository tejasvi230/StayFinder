process.env.NODE_ENV = "test";

const fs = require("fs");
const path = require("path");
const { app } = require("../app.js");

if (!app || typeof app.use !== "function") {
  throw new Error("Express app did not load correctly");
}

const requiredFiles = [
  "views/listings/index.ejs",
  "views/listings/show.ejs",
  "views/listings/new.ejs",
  "views/listings/edit.ejs",
  "views/users/login.ejs",
  "views/users/signup.ejs",
  "views/layouts/boilerplate.ejs",
];

for (const file of requiredFiles) {
  const fullPath = path.join(__dirname, "..", file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

console.log("Smoke check passed: app modules/routes load and required views exist.");
