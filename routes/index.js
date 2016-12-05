var express = require('express');
var router = express.Router();

// Redirection vers la page d'acceuil suite à une authentification

router.get('/', ensureAuthenticated, function(req, res) {
    res.render('index');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {

        res.redirect('/sessions/');
    }
}

module.exports = router;
