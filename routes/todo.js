var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ObjectId = require('mongodb').ObjectId;
var User = require('../models/user');
var cookieParser = require('cookie-parser');
var mongo = require('mongodb')
var mongoose = require('mongoose')
var session = require('express-session')
var db = mongoose.connection
const Todo = require('../models/todos.js')


//affichage des todo de l'utilisateur connecté
router.get('/', function(req, res, next) {
    //pour creer plusieurs page si beaucoup de todo
    let limit = parseInt(req.query.limit) || 20
    let offset = parseInt(req.query.offset) || 0

    if (limit < 1) limit = 1
    else if (limit > 100) limit = 100

    if (offset < 0) offset = 0

    Promise.all([
        Todo.getTodo(req.session.userId, limit, offset),
        Todo.count(),

    ]).then((results) => {
        res.format({
            html: () => {
                //verification de la session
                User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                    if (authResult == false) {
                        console.log(authResult)
                        console.log("pas connecté")
                        res.redirect('/sessions/')

                    } else if (authResult == true) {

                        res.render('todo/index.pug', {
                            todos: results[0],
                            count: results[1].count, // en lien avec la pagination
                            limit: limit,
                            offset: offset
                        })
                    }
                })
            },
            json: () => {
                // en json on vérifie que l'utilisateur est connecté grâce au header 'headertoken' qui est présent sur chaque page
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
                            data: results[0],
                            meta: {
                                count: results[1].count
                            }
                        })
                    }
                })
            }
        })
    })
})

//Affichage de la page pour créer une Todo si l'utilisateur est connecté
router.get('/add', (req, res) => {
    res.format({

        html: () => {
            User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                if (authResult == false) {
                    console.log(authResult)
                    console.log("pas connecté")
                    res.redirect('/sessions/')

                } else if (authResult == true) {

                    res.render("todo/edit.pug", {
                        todo: {},
                        action: '/todo'
                    })
                }
            })
        },
        json: () => {

            //verif header
            headertoken = res.getHeader('X-AccessToken')
            console.log('headertoken >')
            console.log(headertoken)
            User.checkHeader(req.session.userId, headertoken, function(auth2Result) {
                if (auth2Result == false) {

                    res.send({
                        message: 'probleme token'
                    })
                } else if (auth2Result == true) {

                    res.send("/add");
                }
            })
        }
    })
})

//Création de la todo après validation de l'utilisateur
router.post('/', function(req, res) {

    res.format({

        html: () => {
            //on verifie d'abord si l'utilisateur est connecté
            User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                if (authResult == false) {
                    console.log(authResult)
                    console.log("pas connecté")
                    res.redirect('/sessions/')

                } else if (authResult == true) {
                    var userId = req.session.userId;
                    var message = req.body.message;
                    var date = new Date()

                    var newTodo = new Todo({
                        userId: userId,
                        message: message,
                        createdAt: date


                    });
                    //on creer la Todo
                    Todo.createTodo(newTodo, function(err, user) {
                        if (err) throw err;
                        //  console.log(todo);
                        res.redirect('/todo/')
                    });
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
                    res.send('Todo posté')
                }
            })
        }
    })
})

//Supprime la Todo de l'utilisateur selectionné selon l'id de la todo
router.get('/:todoId/delete', (req, res, next) => {
    console.log('delete')
    res.format({
        html: () => {
            User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                if (authResult == false) {
                    console.log(authResult)
                    console.log("pas connecté")
                    res.redirect('/sessions/')

                } else if (authResult == true) {
                    Todo.delete(req.params.todoId).then(() => {
                        res.redirect('/todo/')
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
                    Todo.delete(req.params.todoId).then(() => {
                        res.send('todo deleted')
                    })
                }
            })
        }
    })
})

//on affiche la todo selon son id, que l'utilisateur souhaite modifier
router.get('/:todoId/edit', (req, res, next) => {
    res.format({
        html: () => {
            User.checkSession(req.session.userId, req.session.accessToken, function(authResult) {
                if (authResult == false) {
                    console.log(authResult)
                    console.log("pas connecté")
                    res.redirect('/sessions/')

                } else if (authResult == true) {
                    //on recupere tout les éléments de la todo selectionné
                    Todo.get(req.params.todoId).then((todo) => {


                        res.render('todo/edit.pug', {
                            todo: todo,
                            action: `/todo/${todo.id}?_method=put`
                        })
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
                    res.send('vous etes sur edit')
                }
            })
        }
    })
})

//savegarde de l'édition de la todo
router.post('/:todoId', (req, res, next) => {
    console.log('envoyer edit todo ici')
    Todo.update(req.params.todoId, req.body).then(() => {
        console.log(req.body)
        res.format({
            html: () => {
                res.redirect('/todo/')
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
                            message: 'success'
                        })
                    }
                })
            }
        })
    })
})



module.exports = router;
