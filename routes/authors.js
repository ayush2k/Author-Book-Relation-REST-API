var express = require('express');
var Author = require('../model/author');
var router = express.Router();

router.get('/:id', function (req, res, next) {
    Author.getAuthorById(req.params.id, function (err, author) {
        if (err) {
            next(err);
        }
        if (!author) {
            res.status('404');
            res.send({message : "Not Found: Author not found"});
            return;
        }
        var result = getHalAuthorResource(author);
        res.type('application/hal+json');
        res.status('200');
        res.send(result);
    });
});

router.delete('/:id', function (req, res, next) {
    Author.deleteAuthorById(req.params.id, function (err, author) {
        if (err) {
            next(err);
            return;
        }
        res.type('application/json');
        res.status('204');
        res.send({ message: "Deleted author " + req.params.id });
    });
});

router.patch('/:id', function (req, res, next) {
    var author = {};
    if (req.body.firstname) {
        author.firstname = req.body.firstname;
    }
    if (req.body.lastname) {
        author.lastname = req.body.lastname;
    }
    Author.updateAuthorById(author, req.params.id, function (err, doc) {
        if (err)
            return next(err);
        if (!doc) {
            return next({ message: "Not Found: Author Not Found" });
        }
        var result = getHalAuthorResource(doc)
        res.type('application/hal+json');
        res.status('201');
        res.send(result);
    });
});

router.post('/', function (req, res, next) {
    var author = new Author({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        books: []
    });
    Author.createAuthor(author, function (err, author) {
        if (err)
            return next(err);
        var result = getHalAuthorResource(author);
        res.type('application/hal+json');
        res.status('201');
        res.setHeader('Location', "/authors/" + author._id);
        res.send(result);
    });
});

var getHalAuthorResource = function (author) {
    result = author.toJSON();
    result._links = {}
    result._links.self = { href: "/authors/" + author._id };
    if (!author.books || author.books.length == 0) {
        return result;
    }
    result._embedded = {};
    result._embedded.books = [];
    for (var i = 0; i < result.books.length; i++) {
        result._embedded.books.push(result.books[i]);
        result._embedded.books[i]._links = { self: { href: "/books/" + result.books[i].isbn } };
    }
    delete result.books;
    return result
}


module.exports = router;