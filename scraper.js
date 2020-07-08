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

let oldLEA = {},
    newLEA = new Set();

let update = [],
    insert = [],
    obsolete = [];

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

  newData = newData.slice(0, 3);

  oldData.forEach((agency) => {oldLEA[agency.name + " " + agency.address] = agency.videoRequests}); // Store names of LEAs in dict so they can be accessed in const time

  console.log("Got " + newData.length + " documents from Ring");
  console.log(oldLEA);

  // 2) Iterate through new data, determine which to update and insert
  newData.forEach(function(agency, i){
    let name = agency.name[Object.keys(agency.name)[0]],
        address = agency.address[Object.keys(agency.address)[0]],
        state = address.split(", ")[1],
        activeDate = new Date(agency.ExtendedData.Data[1].value._text),
        videoRequests = parseInt(agency.ExtendedData.Data[2].value._text); //TODO: deal with quarter

    newLEA.add(name + " " + address);

    // If this agency does not exist in dataset, add it
    if(!((name + " " + address) in oldLEA)) insert.push({
      name: name,
      address: address,
      state: state,
      activeDate: activeDate,
      geolocation: {type: 'Point', coordinates: [0, 0]},
      deactivateDate: null,
      videoRequests: videoRequests
    });

    // Otherwise, update it if it needs to be updated
    else if(oldLEA[name + " " + address] != videoRequests) update.push({
      name: name,
      address: address,
      videoRequests: videoRequests,
    });
  });

  // 3) Iterate through old data, determine if there are any obsolete docs
  oldData.forEach(function(agency){ 
    if(!newLEA.has(agency.name + " " + agency.address)) obsolete.push({ // If an existing LEA is not in the new data, it is assumed to have ended its contract
      name: agency.name,
      address: agency.address,
      deactivateDate: new Date()
    });
  })

  console.log("Inserting " + insert.length + " documents");
  console.log("Updating " + update.length + " documents");
  console.log("Deactivating " + obsolete.length + " documents");

  // 4) Geocode all new data TODO: make this faster
  // function getCoords(data, i, callback){
  //   if(!data.length) callback();
  //   else request("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(data[i].address + ", USA") + "&key=" + process.env.GOOGLE_API_KEY, function (error, response, body) {
  //       let coords = JSON.parse(body).results[0].geometry.location;
  //
  //       data[i].geolocation = {type: 'Point', coordinates: [coords.lat, coords.lng]}
  //
  //       if(i < data.length - 1) getCoords(data, i + 1, callback);
  //       else callback();
  //     });
  // }

  // 5) Perform database updates
  let promises = [];

  console.log(update);

  if(insert.length) promises.push(Agency.insertMany(insert));
  if(update.length) update.forEach(function(d){
    promises.push(Agency.findOneAndUpdate({name: d.name, address: d.address}, {videoRequests: d.videoRequests}));
  });
  if(obsolete.length) obsolete.forEach(function(d){
    promises.push(Agency.findOneAndUpdate({name: d.name, address: d.address}, {deactivateDate: d.deactivateDate}));
  });

  if(promises.length) Promise.all(promises).then((values) => {
    console.log("Saved to the Database");
    mongoose.connection.close();
  });
  else mongoose.connection.close();

});
