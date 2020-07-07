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

function getCoords(data, i, callback){ // Geocode a list of addresses
  request("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(data[i].address + ", USA") + "&key=" + process.env.GOOGLE_API_KEY, function (error, response, body) {
      let coords = JSON.parse(body).results[0].geometry.location;

      data[i].geolocation = {type: 'Point', coordinates: [coords.lat, coords.lng]}

      if(i < data.length - 1) getCoords(data, i + 1, callback);
      else callback();
    });
}

// // ** COLLECT DATA **

// 1) Grab all LEA from the Ring website

function getData(callback){
  request('https://www.google.com/maps/d/kml?forcekml=1&mid=1eYVDPh5itXq5acDT9b0BVeQwmESBa4cB&lid=yvtnOP7RJZU', function (error, response, body) {
    if(error) callback(null);
    else callback(JSON.parse(convert.xml2json(body, {compact: true})).kml.Document.Placemark);
  });
}


getData(function(newData){

  // 2) Grab all existing LEA from database
  let oldLEA = new Set(),
      newLEA = new Set();

  let update = [],
      insert = [];

  Agency.find({}, function(err, oldData){
    oldData.forEach((agency) => {oldLEA.add(agency.name);});

    // 3) Iterate through new data
    newData.slice(1, 3).forEach(function(agency, i){
      let name = agency.name._text,
          address = agency.address._text,
          state = address.split(", ")[1],
          videoRequests = parseInt(agency.ExtendedData.Data[2].value._text); //TODO: deal with quarter

      newLEA.add(name);

      // If this agency already exists in dataset
      if(oldLEA.has(name)) update.push({
        name: name,
        videoRequests: videoRequests
      });

      // Otherwise, create new object
      else insert.push({
        name: name,
        address: address,
        state: state,
        activeDate: new Date(agency.ExtendedData.Data[1].value._text),
        deactivateDate: null,
        videoRequests: videoRequests
      });
    });

    // 4) Geocode all new data
    console.log(insert);
    getCoords(insert, 0, function(){
      console.log(insert);
    })


    // 5) Check for LEA which have been deleted

  });

})

//
// // //
// // // // // 2) Check for obsolete LEAs: if an object exists in the database but not in the new data, the contract is down
// // // //
