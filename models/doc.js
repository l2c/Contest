var mongoose = require('mongoose'), 
    Schema = mongoose.Schema;

module.exports = new Schema({
  _creator: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  text: String,
  ext: String,
  date: { type: Date, default: Date.now }
});