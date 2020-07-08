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

// 1) Grab all LEA from the Ring website

function getData(callback){
  request('https://www.google.com/maps/d/kml?forcekml=1&mid=1eYVDPh5itXq5acDT9b0BVeQwmESBa4cB&lid=yvtnOP7RJZU', function (error, response, body) {
    if(error) callback(null);
    else callback(JSON.parse(convert.xml2json(body, {compact: true})).kml.Document.Placemark);
  });
}

getData(function(newData){
  console.log("Grabbed " + newData.length + " documents");

  // 2) Grab all existing LEA from database
  let oldLEA = new Set(),
      newLEA = new Set();

  let update = [],
      insert = [];

  Agency.find({}, function(err, oldData){
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
        deactivateDate: null
      });

      // Otherwise, create new object
      else insert.push({
        name: name,
        address: address,
        state: state,
        activeDate: activeDate,
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
      else Agency.findOneAndUpdate({name: data[i].name}, {videoRequests: data[i].videoRequests, deactivateDate: data[i].deactivateDate}, {new: true}, function(err, doc){
        if(i < data.length - 1) bulkUpdate(data, i + 1, callback);
        else callback();
      });
    }

    getCoords(insert, 0, function(){
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
    })

  });

})
