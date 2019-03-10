const express = require('express');
const mysql = require('mysql');
const app = express();

//MySQL settings
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hitchwiki'
});

//Verify if is connecting to the database
db.connect((err) => {
    if(err) {
        console.log(err);
    } else {
        console.log("Connected to database!");
    }
});
global.db = db;

app.listen(3000, () => {
    console.log(`Server up and running on port: 3000`);
});

//Export modules to use in api.js
module.exports = db;
module.exports = app;
