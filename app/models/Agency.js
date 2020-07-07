let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let agencySchema = new Schema({
  name: String, // LEA name
  address: String, // City, ST
  geolocation: { // Lat, Lon of address
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  activeDate: Date, // When the contract was activated
  active: Boolean, // Is the contract currently active
  videoRequests: Number // Number of times LEA has used Neighbors App to request video this quarter
});


module.exports = mongoose.model('Agency', agencySchema);
