/*
  scraper.js
  Cron job to update the database every 24ish hours
*/

require('dotenv').config();

let mongoose = require("mongoose"),
    Agency = require("./app/models/Agency"),
    Snapshot = require("./app/models/Snapshot"),
    request = require('request'),
    convert = require('xml-js'),
    geocoder = require('node-geocoder')({
      provider: 'google',
      apiKey: process.env.GOOGLE_API_KEY
    });

const DB_URL =  `mongodb+srv://jjshen:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@cluster0.spv4l.mongodb.net/ring-lea?retryWrites=true&w=majority`;

// ** CONNECT TO DB **
mongoose.connect(DB_URL, function(err, res) {
  if(err) console.log("ERROR connecting to database");
  else console.log("SUCCESSfully connected to database");
});

// ** COLLECT DATA **

let oldLEA = {},
    newLEA = new Set();

let update = [],
    insert = [],
    obsolete = [];

let totalRequests = 0,
    totalAgencies = 0;

// 1) Grab all LEA from the Ring website, and existing LEAs from database

function getData(){
  return new Promise(function(resolve, reject){
    request('https://www.google.com/maps/d/kml?mid=1eYVDPh5itXq5acDT9b0BVeQwmESBa4cB&nl=1&forcekml=1', function (error, response, body) {
      if(error) reject();
      let dataURL = JSON.parse(convert.xml2json(body, {compact: true})).kml.Document.NetworkLink.Link.href._cdata;
      console.log(dataURL);
      request(dataURL, function (error, response, body) {
        if(error) reject();
        else resolve(JSON.parse(convert.xml2json(body, {compact: true})).kml.Document.Folder[0].Placemark);
      });
    });
  });
}

Promise.all([getData(), Agency.find({})]).then((values) => {
  let newData = values[0], oldData = values[1];

  oldData.forEach((agency) => {oldLEA[agency.name + " " + agency.address] = agency.videoRequests}); // Store names of LEAs in dict so they can be accessed in const time

  console.log("Got " + newData.length + " documents from Ring");

  // 2) Iterate through new data, determine which to update and insert
  newData.forEach(function(agency, i){
    let name = agency.name[Object.keys(agency.name)[0]],
        address = agency.address[Object.keys(agency.address)[0]],
        state = address.split(", ")[1],
        activeDate = new Date(agency.ExtendedData.Data[1].value._text),
        videoRequests = parseInt(agency.ExtendedData.Data[2].value._text); //TODO: deal with quarter

    totalRequests += videoRequests;
    totalAgencies += 1;

    newLEA.add(name + " " + address);

    // If this agency does not exist in dataset, add it
    if(!((name + " " + address) in oldLEA)) insert.push({
      name: name,
      address: address,
      state: state,
      activeDate: activeDate,
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

  // 4) Perform database updates
  function databaseUpdates(){
    console.log("Inserting " + insert.length + " documents");
    console.log("Updating " + update.length + " documents");
    console.log("Deactivating " + obsolete.length + " documents");

    let promises = [];

    if(insert.length) promises.push(Agency.insertMany(insert));
    if(update.length) update.forEach(function(d){
      promises.push(Agency.findOneAndUpdate({name: d.name, address: d.address}, {videoRequests: d.videoRequests}));
    });
    if(obsolete.length) obsolete.forEach(function(d){
      promises.push(Agency.findOneAndUpdate({name: d.name, address: d.address}, {deactivateDate: d.deactivateDate}));
    });

    // Create snapshot

    let snapshot = new Snapshot({
      date: new Date(),
      videoRequests: totalRequests,
      agencies: totalAgencies,
      insert: insert.map(function(d){return {name: d.name, address: d.address}}),
      update: update.map(function(d){return {name: d.name, address: d.address, videoRequests: d.videoRequests, prevVideoRequests: oldLEA[d.name + " " + d.address]}}),
      obsolete: obsolete.map(function(d){return {name: d.name, address: d.address}}),
    });

    snapshot.save(function(err, doc) {
      if(err){
        mongoose.connection.close();
        throw err;
      }

      if(promises.length) Promise.all(promises).then((values) => {
        console.log("Saved to the Database");
        mongoose.connection.close();
      });
      else mongoose.connection.close();
    });
  }

  databaseUpdates();
})
  .catch(function(){
    mongoose.connection.close();
  })
