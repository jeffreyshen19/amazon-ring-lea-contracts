/*
  scraper.js
  Cron job to update the database every 24ish hours
*/

require('dotenv').config();

let mongoose = require("mongoose"),
    Agency = require("./app/models/Agency"),
    request = require('request'),
    convert = require('xml-js');

const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/ring-lea';

// ** CONNECT TO DB **
mongoose.connect(DB_URL, function(err, res) {
  if(err) console.log("ERROR connecting to database");
  else console.log("SUCCESSfully connected to database");
});

// // ** COLLECT DATA **

let oldLEA = new Set(),
    newLEA = new Set();

let update = [],
    insert = [];

// 1) Grab all LEA from the Ring website, and existing LEAs from database

function getData(){
  return new Promise(function(resolve, reject){
    request('https://www.google.com/maps/d/kml?forcekml=1&mid=1eYVDPh5itXq5acDT9b0BVeQwmESBa4cB&lid=yvtnOP7RJZU', function (error, response, body) {
      if(error) reject();
      else resolve(JSON.parse(convert.xml2json(body, {compact: true})).kml.Document.Placemark);
    });
  });
}

Promise.all([getData(), Agency.find({})]).then((values) => {
  let newData = values[0], oldData = values[1];

  oldData.forEach((agency) => {oldLEA.add(agency.name);});

  // 3) Iterate through new data
  newData.forEach(function(agency, i){
    let name = agency.name[Object.keys(agency.name)[0]],
        address = agency.address[Object.keys(agency.address)[0]],
        state = address.split(", ")[1],
        activeDate = new Date(agency.ExtendedData.Data[1].value._text),
        videoRequests = parseInt(agency.ExtendedData.Data[2].value._text); //TODO: deal with quarter

    newLEA.add(name);

    // If this agency already exists in dataset
    if(oldLEA.has(name)) update.push({
      name: name,
      videoRequests: videoRequests,
    });

    // Otherwise, create new object
    else insert.push({
      name: name,
      address: address,
      state: state,
      activeDate: activeDate,
      geolocation: {type: 'Point', coordinates: [0, 0]},
      deactivateDate: null,
      videoRequests: videoRequests
    });
  });

  console.log("Inserting " + insert.length + " documents");
  console.log("Updating " + update.length + " documents");

  // 4) Geocode all new data TODO: make this faster
  function getCoords(data, i, callback){
    if(!data.length) callback();
    else request("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(data[i].address + ", USA") + "&key=" + process.env.GOOGLE_API_KEY, function (error, response, body) {
        let coords = JSON.parse(body).results[0].geometry.location;

        data[i].geolocation = {type: 'Point', coordinates: [coords.lat, coords.lng]}

        if(i < data.length - 1) getCoords(data, i + 1, callback);
        else callback();
      });
  }

  function bulkUpdate(data, i, callback){
    if(!data.length) callback();
    else Agency.findOneAndUpdate({name: data[i].name}, {videoRequests: data[i].videoRequests, deactivateDate: null}, {new: true}, function(err, doc){
      if(i < data.length - 1) bulkUpdate(data, i + 1, callback);
      else callback();
    });
  }

  /*getCoords(insert, 0, function(){
    console.log("Finished geocoding");

    // 5) Add to database
    bulkUpdate(update, 0, function(){
      console.log("Updated all documents");
      // 6) Check for LEA which have been deleted
      obsoleteLEA = oldData.filter(function(d){
        return !newLEA.has(d.name);
      }).map(function(d){
        d.deactivateDate = new Date();
        return d;
      });
      bulkUpdate(obsoleteLEA, 0, function(){
        console.log("Updated all obsolete documents");

        if(insert.length) Agency.insertMany(insert, function(err, docs){
          console.log("Inserted all documents");
          // Close, we're done
          mongoose.connection.close();
        });
        else mongoose.connection.close();
      });
    });
  })*/

  console.log(insert);

  if(insert.length) Agency.insertMany(insert, function(err, docs){ // Insert any new LEAs
    console.log("Inserted all documents");
    console.log(docs);
    // Close, we're done
    // mongoose.connection.close();
  });

  /*Agency.updateMany({deactivateDate: null}, {deactivateDate: new Date()}, function(err, result) { // All agencies which are not present in the current dataset are assumed to have been removed
    if (err) throw err;
    else bulkUpdate(update, 0, function(){ // Update existing LEAs
      console.log("Updated all obsolete documents");

      if(insert.length) Agency.insertMany(insert, function(err, docs){ // Insert any new LEAs
        console.log("Inserted all documents");
        // Close, we're done
        mongoose.connection.close();
      });
      else mongoose.connection.close();
    });
  });
*/

});
