var express = require('express');
var Book = require('../model/book');
var router = express.Router();

router.get('/:isbn', function(req, res, next){
	Book.getBookByISBN(req.params.isbn, function(err, book){
        if(err){
            return next(err);
        }
        if(!book){
            next({message: "Not Found: Book for isbn: " + req.params.isbn + " not found"});
            return;
        }
        var result = getHalBookResource(book);
        res.type('application/hal+json');
        res.status('200');
        res.send(result);    
    });
});

router.delete('/:isbn', function(req, res, next){
    Book.deleteBookByISBN(req.params.isbn, function(err, book){
        if(err){
            next(err);
            return;
        }
        res.type('application/json');
        res.status('204');
        res.send({message: "Deleted Book " + req.params.isbn});    
    });
});

router.patch('/:isbn', function(req, res, next){
    var book = {};
    if(req.body.title){
        book.title = req.body.title;
    }
    if(req.body.year){
        book.year = req.body.year;
    }
    if(req.body.publisher){
        book.publisher = req.body.publisher;
    }
    Book.updateBookByISBN(book, req.params.isbn, function(err, book){
        if(err){
            return next(err);
        }
        var result = getHalBookResource(book);
        res.type('application/hal+json');
        res.status('201');
        res.send(result);    
    });
});

router.patch('/:isbn/authors', function(req, res, next){
	if(!req.body.id){
        next({message : "Bad Request: Author ID is required"});
        return;
    }
    Book.addAuthorToBook(req.params.isbn, req.body.id, function(err, book){
        if(err){
            return next(err);
        }
        var result = getHalBookResource(book);
        res.type('application/hal+json');
        res.status('201');
        res.send(result);    
    });
});

router.post('/', function(req, res, next){
	var book = new Book({
        isbn: req.body.isbn,
        title: req.body.title,
        publisher: req.body.publisher,
        year: req.body.year                
    });
    Book.createBook(book, req.body.authors, function(err, book){
        if(err)
            return next(err);
        var result = getHalBookResource(book);
        res.type('application/hal+json');
        res.status('201');
        res.setHeader('Location', "/books/" + book.isbn);
        res.send(result);    
    });
});

router.get('/title/:title', function(req, res, next){
	Book.getBookByTitle(req.params.title, function(err, books){
        if(err){
            next(err);
        }
        if(!books){
            books = [];
        }
        var result = getHalBookCollection(req, books);
        res.type('application/hal+json');
        res.status('200');
        res.send(result);    
    });
});

var getHalBookCollection = function(req, books){
    var result = {};
    result.count = books.length;
    result._embedded = {};
    result._embedded.books = []; 
    result._links = {};
    result._links.self = { href: req.originalUrl };
    for (var i = 0; i < books.length; i++) {
        result._embedded.books.push(books[i].toJSON());
        result._embedded.books[i]._links = {self : { href: "/books/" + result._embedded.books[i].isbn }};
    }
    return result
}

var getHalBookResource = function(book){
    result = book.toJSON();
    result._links = {}
    result._embedded = {};
    result._embedded.authors = []
    result._links.self = { href: "/books/" + book.isbn };
    for (var i = 0; i < result.authors.length; i++) {
        result._embedded.authors.push(result.authors[i]);
        result._embedded.authors[i]._links = { self: { href: "/authors/" + result.authors[i]._id } }
    }
    delete result.authors;
    return result
}

module.exports = router;