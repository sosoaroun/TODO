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


//affichage lors d'une deconnection

router.get('/', (req, res, next) => {
    console.log('/erreur, : vous etes deconnecté')
    res.redirect('/erreur')

})




module.exports = router;
