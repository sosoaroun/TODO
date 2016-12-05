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

//definition d'une Todo sous forme de schéma
var mongodb = require('mongodb');

var TodoSchema = mongoose.Schema({
    todoId: {
        type: String,
        index: true
    },
    userId: {
        type: String,
        index: true
    },
    message: {
        type: String
    },

    createdAt: {
        type: String
    },
    updatedAt: {
        type: String
    }
});



var Todo = module.exports = mongoose.model('Todo', TodoSchema);

module.exports.createTodo = function(newTodo, callback) {

    newTodo.save(callback);
};



var todo = mongoose.model('todo', TodoSchema)

//update de la todo selectionné
module.exports.update = function(todoId, params) {
    date = new Date()
    console.log('update params :')

    return todo.update({
        '_id': todoId
    }, {
        $set: {
            'message': params.message,
            'statut': params.statut,
            'updatedAt': date
        }
    })

}




//retourne toute les todo
module.exports.getAll = function(limit, offset) {
    return todo.find()
}

//retourne les Todo de l'utilisateur selectionné
module.exports.getTodo = function(userId, limit, offset) {
    return todo.find({
        userId: userId
    })
}

//retourne le nombre totoal de todo
module.exports.count = function() {
    return todo.count()
}

//retourne le Todo selectionné
module.exports.get = function(todoId) {

    return todo.findById(todoId)
}

//supprime le todo selectionné
module.exports.delete = function(todoId) {
    console.log('bouton delete')
    return todo.remove({
        _id: (todoId)
    })
}
