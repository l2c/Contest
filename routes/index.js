var utile = require('utile'),
    crypto = require('crypto'),
    nodemailer = require('nodemailer'),
    common = require('../common'),
    marked = require('marked'),
    bbcode = require('bbcode'),
    models = require('../models'),
    smtp = nodemailer.createTransport("SMTP", {
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD
      }
    });

var routes = exports;


routes.register = function(req, res) {
  var fields = ['name', 'surname', 'mail', 'website', 'password'],
      doc = utile.filter(req.body, function(v, k) {
        return ~fields.indexOf(k);
      }),
      sha512 = crypto.createHash('sha512');

  if (fields.length !== Object.keys(doc).length || !req.body.password)
    return res.redirect('/error/params');

  doc.salt = utile.randomString(4);
  doc.password = sha512.update(doc.salt + req.body.password).digest('hex');
  
  var user = new models.User(doc);

  user.save(function(err) {
    if (err) {
      if (err.name === 'ValidationError')
        return res.redirect('/error/' + Object.keys(err.errors).shift());
      else {
        console.error(err);
        return res.end(res.writeHead(500));
      }
    }

    smtp.sendMail({
      from: process.env.GMAIL_USERNAME,
      to: user.mail,
      subject: 'Validate your registration',
      html: 'Click <a href="http://127.0.0.1:3000/activate/' + user.mail + '/' + user.key + '">here</a> to validate your registration'
    }, function(err) {
      if (err)
        return res.redirect('/error/mail');

      res.render('registered.jade');
    });
  });
};

routes.activate = function(req, res) {
  var key = req.params.key,
      mail = req.params.mail;

  models.User.findOne({mail: mail}, function(err, user) {
    if (!user)
      return res.redirect('/error/mail');

    if (user.key !== key)
      return res.redirect('/error/key');

    user.actived = true;
    user.save(function(err) {
      if (err)
        return res.end(res.writeHead(500));

      res.render('actived.jade');
    });
  });
};

routes.save = function(req, res) {
  var title = req.body.title,
      content = req.body.content,
      ext = req.body.ext || 'txt';

  if (!content || !title)
    return res.redirect('/error/params');

  var doc = new models.Document({
    title: title,
    text: content,
    ext: ext,
    _creator: req.user._id
  });

  doc.save(function(err) {
    if (err)
        return res.end(res.writeHead(500));
    
    req.user.docs.push(doc._id);
    req.user.save(function(err) {
      if (err)
        return res.end(res.writeHead(500));

      res.redirect('/panel');
    });
  });
};

routes.download = function(req, res) {
  var title = req.body.title,
      content = req.body.content,
      ext = req.body.ext || 'txt',
      parsed = common.parse(ext, title, content);
      

  if (!title || !content)
    return res.redirect('/error/params');

  res.writeHead(200, {
    'Pragma': 'public',
    'Content-Type': 'application/octet-stream',
    'Content-Length': parsed.content.length,
    'Content-Disposition': 'attachment; filename="' + parsed.filename + '"',
    'Content-Transfer-Encoding': 'binary'
  });

  res.end(parsed.content);
};

routes.downloadId = function(req, res) {
  var id = req.params.id;

  models.Document.findById(id, function(err, doc) {
    var filename, content;

    if (err || !doc)
      return res.end(res.writeHead(500));

    if (doc._creator.toString() !== req.user._id.toString())
      return res.end(res.writeHead(401));

    switch(doc.ext) {
      case 'txt':
        content = doc.text;
        filename = doc.title + '.txt';
        break;

      case 'md':
        content = marked(doc.text);
        filename = doc.title + '.html';
        break;
    }

    res.writeHead(200, {
      'Pragma': 'public',
      'Content-Type': 'application/octet-stream',
      'Content-Length': content.length,
      'Content-Disposition': 'attachment; filename="' + filename + '"',
      'Content-Transfer-Encoding': 'binary'
    });

    res.end(content);
  });
};

routes.logout = function(req, res) {
  req.logOut();
  res.redirect('/');
};