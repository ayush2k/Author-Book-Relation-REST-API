var express = require('express');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/BookAuthors');
var db = mongoose.connection;

var books = require('./routes/books');
var authors = require('./routes/authors');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/books', books);
app.use('/authors', authors);

app.use(function(err, req, res, next) {
    if(err.message.indexOf("validation") > -1){
        res.status(400);
        var error = {message: err.message};
        error.errors = err.errors;
        res.send(error);
    }
    else if(err.message.indexOf("11000") > -1){
        res.status(409);
        res.send({message: err.message});
    }
    else if(err.message.indexOf("Conflict") > -1){
        res.status(409);
        res.send(err);
    }
    else if(err.message.indexOf("Bad Request") > -1){
        res.status(400);
        res.send(err);
    }
    else if(err.message.indexOf("Cast") > -1){
        res.status(400);
        res.send({message : err.message});
    }
    else if(err.message.indexOf("Not Found") > -1){
        res.status(404);
        res.send({message : err.message});
    }
    else{
        res.status(500);
        res.send({message: "Server Error"});
    }
});

app.listen(8081);
