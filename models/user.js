var mongoose = require('mongoose'),
    utile = require('utile'),
    Schema = mongoose.Schema;

module.exports = new Schema({
  name: { type: String, required: true, unique: true },
  surname: { type: String, required: true },
  mail: { type: String, required: true, unique: true, match: /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/ },
  website: { type: String, required: true, match: /^(http|https):\/\// },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  date: { type: Date, default: Date.now },
  actived: { type: Boolean, default: false },
  key: { type: String, default: utile.randomString },
  docs: [{ type: Schema.Types.ObjectId, ref: 'Document' }]
});