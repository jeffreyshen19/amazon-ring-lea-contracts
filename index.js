/*
  index.js
  Backend API serving db to frontend
*/

require('dotenv').config();

let express = require("express"),
    mongoose = require("mongoose"),
    Agency = require("./app/models/Agency"),
    Snapshot = require("./app/models/Snapshot"),
    cors = require('cors');

let app = express();
app.use(cors());

const PORT = process.env.PORT || 3000,
      DB_URL = `mongodb+srv://jjshen:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@cluster0.spv4l.mongodb.net/ring-lea?retryWrites=true&w=majority`;


// ** CONNECT TO DB **
mongoose.connect(DB_URL, function(err, res) {
  if(err) console.log(err, "ERROR connecting to database");
  else console.log("SUCCESSfully connected to database");
});

app.get("/", function(req, res){
  Promise.all([
    Snapshot.findOne({}).sort({date: -1}), //Most recent snapshot
    Agency.find({}) // All agency data
  ]).then(function(values){
    res.json({
      snapshot: values[0],
      agencies: values[1]
    });
  });
});

// ** START THE SERVER **
app.listen(PORT);
console.log("Running on http://127.0.0.1:" + PORT);
module.exports = app;
