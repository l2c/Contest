var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    common = require('./common'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
    path = require('path');

var app = express();

common.initPassport();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'yagonimod' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
  app.use(express.csrf());
  app.use(common.locals);
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', common.redirect('/register'));
app.get('/register', common.render('register.jade'));
app.get('/error/:type', common.render('error.jade'));
app.get('/login', common.render('login.jade'));
app.get('/activate/:mail/:key', routes.activate);
app.get('/write', [ensureLoggedIn('/login'), common.render('write.jade')]);
app.get('/panel', [ensureLoggedIn('/login'), common.render('panel.jade')]);
app.get('/download/:id', [ensureLoggedIn('/login'), routes.downloadId]);

app.post('/register', routes.register);
app.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/panel', failureRedirect: '/login' }));
app.post('/download', [ensureLoggedIn('/login'), routes.download]);
app.post('/save', [ensureLoggedIn('/login'), routes.save]);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
