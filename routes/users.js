var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ObjectId = require('mongodb').ObjectId;
var User = require('../models/user');
var cookieParser = require('cookie-parser');
var mongo = require('mongodb')
var mongoose = require('mongoose')
mongoose.connection.close
mongoose.connect('mongodb://localhost/loginapp')
var db = mongoose.connection
var sess = require('express-session')
var Redis = require('ioredis')
var redis = new Redis();
var session = require('express-session')
let logger = (key) => {
    return (val) => {
        console.log(`> ${key}: `, val)
        return val
    }
}


//Affiche tout les utilisateurs
router.get('/', function(req, res, next) {

    let limit = parseInt(req.query.limit) || 20
    let offset = parseInt(req.query.offset) || 0

    if (limit < 1) limit = 1
    else if (limit > 100) limit = 100

    if (offset < 0) offset = 0

    if (req.session.lastPage) {
        console.log('Last page was: ' + req.session.lastPage + '. ');
    }



    req.session.lastPage = '/liste';
    console.log('liste');

    Promise.all([
        User.getAll(limit, offset),
        User.count(),

    ]).then((results) => {
        // results[0] => [user, user, user]
        // results[1] => {count: ?}
        res.format({
            html: () => {
                console.log("req.session.accessToken de /users/")
                console.log(req.session.accessToken)


                res.render('liste.pug', {
                    users: results[0],
                    count: results[1].count, // en lien avec la pagination
                    limit: limit,
                    offset: offset,
                    pseudo: req.session.pseudo

                })
            },
            json: () => {
                res.send({
                    data: results[0],
                    meta: {
                        count: results[1].count
                    }
                })
            }
        })
    }).catch(next)
})

//Supprime l'utilisateur selectionné si on est connecté
router.get('/:userId/delete', (req, res, next) => {


    console.log('delete')
    res.format({
        html: () => {
            User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                if (authResult == false) {
                    console.log(authResult)
                    console.log("pas connecté")
                    res.render('error')

                } else if (authResult == true) {
                    User.delete(req.params.userId).then(() => {
                        res.redirect('/sessions/')
                    })
                }
            })
        },

        json: () => {
            headertoken = res.getHeader('X-AccessToken')
            console.log('headertoken >')
            console.log(headertoken)
            User.checkHeader(req.session.userId, headertoken, function(auth2Result) {
                if (auth2Result == false) {

                    res.send({
                        message: 'probleme token'
                    })
                } else if (auth2Result == true) {
                    User.delete(req.params.userId).then(() => {
                        res.send({

                            message: 'utilisateur supprimé'
                        })
                    })
                }
            })
        }


    })
})

//supprime l'utilisateur selectionné
router.delete('/:userId', (req, res, next) => {
    console.log('delete')
    res.format({
        html: () => {
            User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                if (authResult == false) {
                    console.log(authResult)
                    console.log("pas connecté")
                    res.render('error')

                } else if (authResult == true) {
                    User.delete(req.params.userId).then(() => {
                        res.redirect('/sessions/')
                    })
                }
            })
        },

        json: () => {
            headertoken = res.getHeader('X-AccessToken')
            console.log('headertoken >')
            console.log(headertoken)
            User.checkHeader(req.session.userId, headertoken, function(auth2Result) {
                if (auth2Result == false) {

                    res.send({
                        message: 'probleme token'
                    })
                } else if (auth2Result == true) {
                    User.delete(req.params.userId).then(() => {
                        res.send({

                            message: 'utilisateur supprimé'
                        })
                    })
                }
            })
        }


    })
})



// ajouter un utilisateur
router.get('/add', function(req, res) {
    res.format({
        html: () => {
            res.render('register');
        },
        json: () => {
            res.send({
                message: 'success'
            })
        }
    })

});


//Affiche un utilisateur selectionné d'apres son id
router.get('/:userId', (req, res, next) => {
    console.log('/userid')
    console.log("connecté")
    User.get(req.params.userId).then((user) => {
        console.log('userId:')
        if (!user) return next()
        if (req.session.lastPage) {
            console.log('Last page was: ' + req.session.lastPage + '. ');
        }
        req.session.lastPage = 'userid';
        console.log('userid');
        res.format({
            html: () => {
                User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                    if (authResult == false) {
                        console.log(authResult)
                        console.log("pas connecté")
                        res.format({
                            html: () => {
                                res.redirect('/sessions/')
                            },

                        })
                    } else if (authResult == true) {
                        res.render('show.pug', {
                            user: user
                        })
                    }
                })
            },
            json: () => {
                headertoken = res.getHeader('X-AccessToken')
                console.log('headertoken >')
                console.log(headertoken)
                User.checkHeader(req.session.userId, headertoken, function(auth2Result) {
                    if (auth2Result == false) {

                        res.send({
                            message: 'probleme token'
                        })
                    } else if (auth2Result == true) {

                        res.send({

                            data: user
                        })
                    }
                })
            }
        })
    })
})


//affiche la page d'édition avec l'utilisateur a modifié selon son id seulement si vous êtes connecté
router.get('/:userId/edit', (req, res, next) => {
    User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
        if (authResult == false) {
            console.log(authResult)
            console.log("pas connecté")
            res.redirect('/sessions/')

        } else if (authResult == true) {
            User.get(req.params.userId).then((user) => {
                if (!user) return next()

                res.render('edit.pug', {
                    user: user,
                    action: `/users/${user.id}?_method=put`
                })
            }).catch(next)


        }
    })
})

//Ajout d'un utilisateur selon ce qui est ecrit dans le body
router.post('/add', function(req, res) { //gere creation user html
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    // Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors
        });
    } else {
        var newUser = new User({ // on créer un nouvel utilisateur suivant le UserSchema de mongodb
            name: name,
            email: email,
            username: username,
            password: password
        });

        User.createUser(newUser, function(err, user) { // fonction qui prend la variable newUser afin de la mettre dans mongodb
            if (err) throw err;
            console.log(user);
        });

        req.flash('success_msg', 'tu est inscrit, redirection vers page de connexion');
        res.redirect('/sessions/logout')
        res.redirect('/sessions/')
    }
});

//Ajout d'un utilisateur selon ce qui est ecrit dans le body
router.post('/', function(req, res) { //gere creation user json
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    // Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        res.render('register', {
            errors: errors
        });
    } else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password
        });

        User.createUser(newUser, function(err, user) {
            if (err) throw err;
            console.log(user);
        });

        req.flash('success_msg', 'tu est inscrit, redirection vers page de connexion');

        res.redirect('/sessions/')
    }
});

//Sauvegarde des modifications apporté à l'utilisateur
router.post('/:userId', (req, res, next) => {
    console.log('envoyer edit user ici')
    User.update(req.params.userId, req.body).then(() => {
        res.format({
            html: () => {
                res.redirect('/users/')
            },
            json: () => {
                res.send({
                    message: 'success'
                })
            }
        })
    }).catch(next)
})


//passport nous permet de checker si l'utilisateur existe bien dans la BDD, et que le mot de passe est correcte
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username, function(err, user) {
            if (err) throw err;
            if (!user) {
                return done(null, false, {
                    message: 'Unknown User'
                });
            }

            User.comparePassword(password, user.password, function(err, isMatch) { //fonction de comparaison de données
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {
                        message: 'Invalid password'
                    });
                }
            });
        });
    }));


//les 2 fonctions suivantes servent au bon fonctionnement de passport
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});





module.exports = router;
