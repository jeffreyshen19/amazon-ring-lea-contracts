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
// mongoose.connect(DB_URL, function(err, res) {
//   if(err) console.log("ERROR connecting to database");
//   else console.log("SUCCESSfully connected to database");
// });

function getCoords(address, callback){
  request("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(address + ", USA") + "&key=" + process.env.GOOGLE_API_KEY, function (error, response, body) {
      let coords = JSON.parse(body).results[0].geometry.location;
      callback([coords.lat, coords.lng]);
    });
}

// // ** COLLECT DATA **
//
// // 1) Grab all LEA from the Ring website
//
// function getData(callback){
//   request('https://www.google.com/maps/d/kml?forcekml=1&mid=1eYVDPh5itXq5acDT9b0BVeQwmESBa4cB&lid=yvtnOP7RJZU', function (error, response, body) {
//     if(error) callback(null);
//     else callback(JSON.parse(convert.xml2json(body, {compact: true})).kml.Document.Placemark);
//   });
// }
//
// {type: 'Point', coordinates: [parseFloat(coords[0]), parseFloat(coords[1])] }
//
// getData(function(newData){
//
//   // 2) Grab all existing LEA from database
//   let oldLEA = new Set(),
//       newLEA = new Set();
//
//   let update = [],
//       insert = [];
//
//   Agency.find({}, function(err, oldData){
//     oldData.forEach((agency) => {oldLEA.add(agency.name);});
//
//     newData.forEach(function(agency){
//       let name = agency.name._text,
//           videoRequests = parseInt(agency.ExtendedData.Data[2].value._text); //TODO: deal with quarter
//
//
//       newLEA.add(name);
//
//       // If this agency already exists in dataset
//       if(oldLEA.has(name)) update.push({
//         name: name,
//         videoRequests: videoRequests
//       })
//       else insert.push({
//         name: name,
//         address: agency.address._text,
//         geolocation: TODO,
//         activeDate: new Date(agency.ExtendedData.Data[1].value._text),
//         deactivateDate: null,
//         videoRequests: videoRequests
//       });
//
//
//
//     });
//
//
//   });
//
// })
//
//
//
//
//
//
// //
// // // // 2) Check for obsolete LEAs: if an object exists in the database but not in the new data, the contract is down
// // //
// //
// //
// // // Bulk Upsert data
// //
// // getData(function(data){
// //   console.log(JSON.stringify(data[0]));
// //
// //
// // mongoose.connection.on("open", function(err,conn) {
// //
// //    var bulk = Sample.collection.initializeOrderedBulkOp();
// //    var counter = 0;
// //
// //    // representing a long loop
// //    for ( var x = 0; x < 100000; x++ ) {
// //
// //        bulk.find(/* some search */).upsert().updateOne(
// //            /* update conditions */
// //        });
// //        counter++;
// //
// //        if ( counter % 1000 == 0 )
// //            bulk.execute(function(err,result) {
// //                bulk = Sample.collection.initializeOrderedBulkOp();
// //            });
// //    }
// //
// //    if ( counter % 1000 != 0 )
// //        bulk.execute(function(err,result) {
// //           // maybe do something with result
// //        });
// //
// // });
// // })
