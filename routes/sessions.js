var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ObjectId = require('mongodb').ObjectId;
var User = require('../models/user');
var cookieParser = require('cookie-parser');
var mongo = require('mongodb')
var mongoose = require('mongoose')

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



//page de connexion prenant devant être remplie par un pseudo et un password
router.get('/', (req, res, next) => {
    console.log('/sessions')
    User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
        if (authResult == false) {
            console.log(authResult)
            console.log("pas connecté")
            res.render('login')

        } else if (authResult == true) {
            res.redirect("/users/")

        }
    })
})

//une fois le pseudo et le password envoyer, passport se charge de l'authentification
router.post('/',
    passport.authenticate('local', { //fonction de passport qui compare les données
        session: false
    }),
    function(req, res) {
        console.log("login réussi, Id utilisateur: ", req.user.id)

        req.session.userId = req.user.id
        require('crypto').randomBytes(48, function(err, buffer) { // on crypte le mot de passe
            token = buffer.toString('hex')
            req.session.accessToken = token
            req.session.pseudo = req.user.name
            console.log(req.session.pseudo)




            res.format({

                html: () => {

                    User.addsession(req.session.userId, token) // on set un cookie accessToken(où accessToken est un nombre aléatoire créer au login)
                    redis.expire(`user:${req.session.userId}`, 60) // on set une expiration de 60 secondes pour la session


                    res.redirect('/todo/')
                },
                json: () => {
                    res.setHeader("X-AccessToken", token);

                    res.send({
                        AccessToken: token
                    })
                }

            })

        })
    })

router.get('/logout', function(req, res) { // marche

    redis.del(`user:${req.session.userId}`);
    console.log('session detruite')
    req.session.destroy();
    req.logout();

    //req.flash('success_msg', 'You are logged out');

    res.redirect('/sessions');
});

router.get('/accueil', function(req, res) { // marche

    res.render('index')
});


router.delete('/', function(req, res) { // marche pas

    console.log(redis.hgetall(`user:${'5830a598669da241df160cd9'}`))
    redis.del(`user:${'5830a598669da241df160cd9'}`)


    console.log(req.session.accessToken)
    req.session.destroy();
    req.logout();

    console.log('session detruite')
    res.send("test")

});


module.exports = router;
