var mongoose = require('mongoose');
var Author = require('../model/author.js');

var BookSchema = mongoose.Schema({
	isbn: {
        type: String,
        unique: true,
        required: [true, "ISBN is required"]
    },
    title: {
		type: String,
        required: [true, "Title is required"]
	},
	authors: {
		type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Author'}],
        required: true
	},
    publisher: {
        type: String
    },
    year:{
        type: String
    }
}, { versionKey: false});

var Book = module.exports = mongoose.model("Book", BookSchema);

module.exports.createBook = function(newBook, authors, callback){
	if(!authors || authors.length == 0){
        return callback({message: "Bad Request: Atleast One Author is needed"}, null);
    }
    Author.find({ '_id': { $in: authors}}, function(err, retauthors){
        if (err){
            return callback(err, null);
        }
        if(authors.length != retauthors.length){
            return callback({message: "Bad Request: One or more author doesn't exist"}, null)
        }
        newBook.authors = retauthors;
        newBook.save(function(err, book){
            if(err){
                return callback(err, null);
            }
            Author.update({'_id': {$in: authors}}, {$push: {'books': book}}, {multi : true},  function(err, doc){
                if(err){
                    Book.findOneAndRemove({'_id': book.id}, function(err, doc){
                       return callback(err, null); 
                    });
                    return callback(err, null);
                }
                Book.findOne({'_id' : book._id}).populate("authors").exec(callback);    
            });
        });
    })
};

module.exports.addAuthorToBook = function(_isbn, authorId, callback){
    Author.findOne({ '_id': { $in: authorId } }, function (err, author) {
        if (err)
            return callback(err, null);
        if (!author)
            return callback({ message: "Bad Request: Author with ID:" + authorId + "doesn't exist" }, null);
        Book.findOne({ 'isbn': _isbn }, function (err, book) {
            if (err)
                return callback(err, null);
            if (!book)
                return callback({ message: "Not Found: Book " + _isbn  + "Not Found" }, null);
            Author.findOneAndUpdate({ '_id': authorId }, { $push: { 'books': book } }, function (err, doc) {
                if (err) {
                    return callback(err, null);
                }
                Book.findOneAndUpdate({ 'isbn': _isbn }, { $addToSet: { 'authors': author } }, function (err, doc) {
                    if (err) {
                            Author.findOneAndUpdate({ '_id': authorId }, { $pull: { 'books': book._id } }, function (err, doc) {
                            return callback(err, null);
                        });
                        return callback(err, null);
                    }
                    Book.findOne({_id : doc._id}).populate("authors").exec(callback);
                });
            });
        });
    });
};


module.exports.getBookByTitle = function(_title, callback){
	var query = {title: {$regex: _title}};
	Book.find(query, callback);
};

module.exports.getBookByISBN = function(_isbn, callback){
	var query = {isbn: _isbn};
	Book.findOne(query).populate('authors').exec(callback);
};

module.exports.deleteBookByISBN = function(_isbn, callback){
	var query = {isbn: _isbn};
    Book.findOne(query, function(err, book){
        if (err){
            return callback(err, null)
        }
        if(!book){
            return callback(null, null);
        }
        Author.update({_id: {$in: book.authors}}, {$pull: {"books": book._id}}, {multi: true}, function(err, doc){
            if (err)
                return callback(err, null)
            Book.remove(query, callback);      
        });
    });
};

module.exports.updateBookByISBN = function(book, _isbn, callback){
    var query = {isbn: _isbn};
    Book.findOneAndUpdate(query, {$set: book}, function(err, book){
            if(err)
                return callback(err, null);
            Book.findOne({isbn: book.isbn}).populate("authors").exec(callback);
    }) ;
}