// Dépendances native
const path = require('path')

// Dépendances 3rd party
const express = require('express')
const bodyParser = require('body-parser')
const sass = require('node-sass-middleware')
var exphbs = require('express-handlebars');
const methodOverride = require('method-override')
var expressValidator = require('express-validator')
var flash = require('connect-flash')
var LocalStrategy = require('passport-local').Strategy
var mongo = require('mongodb')
var mongoose = require('mongoose')
mongoose.createConnection('mongodb://localhost/loginapp');
var db = mongoose.connection
    //const db = require('sqlite')
    // Constantes et initialisations
const PORT = process.PORT || 8080
const app = express()
var cons = require('consolidate')
var hbs = exphbs.create({
    defaultLayout: 'layout.handlebars'
});
var mongoose = require('mongoose');
var passport = require('passport');
//var configDB = require('./config/database.js');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var redis = require('redis')
var redisStore = require('connect-redis')(session)
var client = redis.createClient();

var User = require('./models/user');



app.use(cookieParser())
app.set('views', __dirname + '/views');

// assign the swig engine to .html files
app.engine('pug', cons.pug);
app.engine('handlebars', exphbs({
    defaultLayout: 'layout'
}), cons.handlebars)


// set .html as the default extension
app.set('view engine', 'handlebars');



/*
// Mise en place des vues
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');
*/

// Préprocesseur sur les fichiers scss -> css/*
app.use(sass({
    src: path.join(__dirname, 'styles'),
    dest: path.join(__dirname, 'assets', 'css'),
    prefix: '/css',
    outputStyle: 'expanded'
}))

app.use(session({
    secret: 'lol',
    store: new redisStore({
        host: 'localhost',
        port: 6379,
        client: client,
        ttl: 260
    }),
    saveUninitialized: false,
    resave: false

}))



// On sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'assets')))

// Method override
//app.use(methodOverride('_method', {methods: ['GET', 'POST']}))
app.use(methodOverride(function(req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}))

// Middleware pour parser le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}))

// Passport init
app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']'
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        }
    }
}))

//mongoose.connect(configDB.url); // connect to our database
// Connect Flash

app.use(flash());


// Global Vars
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;

    next();
});


app.use(function(req, res, next) {
    if (req.session.accessToken == null) {
        headertokenget = 'Substitution'
    } else if (req.session.accessToken != null) {
        headertokenget = req.session.accessToken
        res.setHeader('X-AccessToken', headertokenget)
    }
    next();
});
// La liste des différents routeurs (dans l'ordre)

app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))
app.use('/sessions', require('./routes/sessions'))
app.use('/todo', require('./routes/todo'))


//app.use('/erreur', require('./routes/erreur'))}
//User.compareAccessToken()

// Erreur 404
/*
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})
*/


// Set Port
app.set('port', (process.env.PORT || 8080));

app.listen(app.get('port'), function() {
    console.log('Server started on port ' + app.get('port'));
});
