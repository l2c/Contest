var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var models = exports;

var db = mongoose.createConnection('localhost', 'dc');

models.User = db.model('User', require('./user'));
models.Document = db.model('Document', require('./doc'));

