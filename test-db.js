// Simple test to verify sql.js works with require
const fs = require('fs');
const path = require('path');

const SQL_JS_PATH = path.join(__dirname, 'node_modules/sql.js/dist/sql-asm.js');
const SQL = require(SQL_JS_PATH);

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'test.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db;
if (fs.existsSync(DB_PATH)) {
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
} else {
  db = new SQL.Database();
}

db.run('PRAGMA foreign_keys = ON;');
db.run('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT);');
db.run('INSERT INTO test (name) VALUES (?);', ['hello']);

const result = db.exec('SELECT * FROM test;');
console.log('Test query result:', JSON.stringify(result, null, 2));

const data = db.export();
fs.writeFileSync(DB_PATH, Buffer.from(data));
db.close();

console.log('Database test passed!');