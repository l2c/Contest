var crypto = require('crypto'),
    passport = require('passport'),
    marked = require('marked'),
    LocalStrategy = require('passport-local').Strategy,
    models = require('./models');


exports.render = function(name) {
  return function(req, res) {
    res.render(name, req.params);
  };
};

exports.redirect = function(path) {
  return function(req, res) {
    res.redirect(path);
  };
};

exports.initPassport = function() {
  passport.use(new LocalStrategy(
    function(username, password, done) {
      models.User.findOne()
        .or([{name: username}, {mail: username}])
        .exec(function(err, user) {
          var sha512 = crypto.createHash('sha512');

          if (
            err           || 
            !user         ||
            !user.actived ||
            sha512.update(user.salt + password).digest('hex') !== user.password
          ) return done(null, false);

          done(null, user);
        });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    models.User.findById(id)
      .populate('docs')
      .exec(function (err, user) {
        user.documents = user.docs.toObject().sort(function(a, b) {
          if (a.title[0] === b.title[0])
            return 0;

          return (a.title[0] > b.title[0]) ? 1 : -1;
        });

        done(err, user);
      });
  });
};

exports.locals = function(req, res, next) {
  res.locals.user = req.user;
  res.locals._csrf = req.session._csrf;

  next();
};

exports.parse = function(ext, title, content) {
  var ret = {};

  switch(ext) {
    case 'txt':
      ret.filename = title + '.txt';
      ret.content = content;
      break;

    case 'md':
      ret.filename = title + '.html';
      ret.content = marked(content);
      break;
  }

  return ret;
};