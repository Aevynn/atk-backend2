const fs = require("fs-extra");
const path = require("path");

function dbPath(filename) {
  return path.join(__dirname, "..", "data", filename);
}

function readJSON(filename) {
  const p = dbPath(filename);
  try {
    return fs.readJsonSync(p);
  } catch (err) {
    // if file missing, return sensible default
    if (filename === "products.json") return [];
    if (filename === "users.json") return [];
    if (filename === "transactions.json") return [];
    return null;
  }
}

function writeJSON(filename, data) {
  const p = dbPath(filename);
  fs.ensureFileSync(p);
  fs.writeJsonSync(p, data, { spaces: 2 });
}

module.exports = {
  readJSON,
  writeJSON
};
