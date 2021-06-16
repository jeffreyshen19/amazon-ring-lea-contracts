let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let agencySchema = new Schema({
  name: String, // LEA name
  address: String, // City, ST
  city: String,
  activeDate: Date, // When the contract was activated
  deactivateDate: Date, // Roughly when the contract was deactived, null if not
  videoRequests: Number, // Number of times LEA has used Neighbors App to request video this quarter
  profile: String // URL for agency page
}, { strict: false });


module.exports = mongoose.model('Agency', agencySchema);
