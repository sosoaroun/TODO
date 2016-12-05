var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var ObjectId = require('mongodb').ObjectId;
var Redis = require('ioredis')
var redis = new Redis();
var session = require('express-session')
let logger = (key) => {
    return (val) => {
        console.log(`> ${key}: `, val)
        return val
    }
}

//description d'un Utilisateur sous forme de schéma
var mongodb = require('mongodb');
var UserSchema = mongoose.Schema({ // initialisation du modèle user utilisé par mongo
    username: {
        type: String,
        index: true
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    name: {
        type: String
    }
});




var User = module.exports = mongoose.model('User', UserSchema);


//Creation d'utilisateur avec un mdp crypté
module.exports.createUser = function(newUser, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}







//retourne l'utilisateur selectionné
module.exports.getUserByUsername = function(username, callback) {
    var query = {
        username: username
    };
    User.findOne(query, callback);
}


//A partir d'un ID retourne l'utilisateur selectionné
module.exports.getUserById = function(id, callback) {

    User.findById(id, callback);
}

//retourne le todo a partir de son ID
module.exports.getTodoById = function(userId) {

    Todo.findById(UserId, callback);
}

//verification du mot de passe avec bcrypt
module.exports.comparePassword = function(candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });
}


var users = mongoose.model('user', UserSchema)


//retourne tout les utilisateur de la BDD
module.exports.getAll = function(limit, offset) {
    return users.find()
}


//Retourne le nombre d'utilisateur dans la BDD
module.exports.count = function() {
    return users.count()
}



module.exports.get = function(userId) {

    return users.findById(userId)
}

module.exports.update = function(userId, params) { //fonction update (utilisé pour l'edit...)

    //db.run.apply(db, query, dbArgs)
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(params.mdp, salt);

    return users.update({
        '_id': userId
    }, {
        $set: {
            'name': params.pseudo,
            'username': params.firstname,
            'email': params.email,
            'password': hash
        }
    })

}



module.exports.delete = function(userId) {
    console.log('bouton delete')
    return users.remove({
        _id: (userId)
    });
}


//fonction qui permet de vérifier la session en cours
module.exports.checkSession = function(userId, sessiontoken, callback) {
    var auth = null; // on initialise un variable

    redis.hget(`user:${userId}`, "accessToken", function(err, object) { // object = un objet de redis
        console.log('object')
        console.log(object);
        if (sessiontoken == object && object != null && sessiontoken != null) {
            console.log("connexion OK")
            auth = true // auth = true donc la session est verifié
        } else {
            auth = false // auth= false donc la session est invalide
        }

        callback(auth)

    })

}

//fonction qui utilise le meme concept que checkSession, mais pour les header (donc le json)
module.exports.checkHeader = function(userId, headertoken, callback) {
    var auth2 = null;
    console.log('checkheader')
    console.log(headertoken)
    redis.hget(`user:${userId}`, "accessToken", function(err, object) {
        console.log('object checkheader')
        console.log(object);
        if (headertoken == object && object != null) {
            console.log("connexion OK")
            auth2 = true
        } else {
            auth2 = false
        }

        callback(auth2)

    })

}

//fonction qui ajoute une session, on l'utilise principalement au login
module.exports.addsession = function(userId, accessToken) {
    let pipeline = redis.pipeline() // initialisation de la pipeline
    let token = accessToken


    console.log(`user:${userId}`)
    pipeline.hmset(`user:${userId}`, { //on utilise la pipeline pour mettre les info qui suivent dans user avec le userid associé
        accessToken: token,
        createdAt: new Date()
    })



    pipeline.sadd('users', userId)

    return pipeline.exec()

    //la session est créer dans redis
}
