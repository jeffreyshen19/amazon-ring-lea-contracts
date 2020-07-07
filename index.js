/*
  index.js
  Backend API serving db to frontend
*/

let express = require("express"),
    mongoose = require("mongoose"),
    Agency = require("./app/models/Agency");

let app = express();

const PORT = process.env.PORT || 3000,
      DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/ring-lea';

// ** CONNECT TO DB **
mongoose.connect(DB_URL, function(err, res) {
  if(err) console.log("ERROR connecting to database");
  else console.log("SUCCESSfully connected to database");
});

app.get("/", function(req, res){
  Agency.find({}, function(err, agencies){
    res.json(agencies);
  });
});

// ** START THE SERVER **
app.listen(PORT);
console.log("Running on http://127.0.0.1:" + PORT);
module.exports = app;
