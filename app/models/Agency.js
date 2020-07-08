let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let agencySchema = new Schema({
  name: String, // LEA name
  address: String, // City, ST
  city: String,
  geolocation: { // Lat, Lon of address
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number]
    }
  },
  activeDate: Date, // When the contract was activated
  deactivateDate: Date, // Roughly when the contract was deactived, null if not
  videoRequests: Number // Number of times LEA has used Neighbors App to request video this quarter
});


module.exports = mongoose.model('Agency', agencySchema);
