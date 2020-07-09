let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let snapshotSchema = new Schema({
  date: Date, // When snapshot was created
  videoRequests: Number, // Total number of video requests
  agencies: Number, // Total number of law enforcement agencies
  insert: [Object], // Record of which agencies were inserted  FIELDS: name, address
  update: [Object], // Record of which agencies were updated  FIELDS: name, address, videoRequests, prevVideoRequests
  obsolete: [Object], // Record of which agencies were marked as obsolete FIELDS: name, address
});

module.exports = mongoose.model('Snapshot', snapshotSchema);
