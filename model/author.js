var mongoose = require('mongoose');
var AuthorSchema = mongoose.Schema({
	firstname: {
		type: String,
        required: [true, "Firstname is Required"]
	},
	lastname: {
		type: String,
        required: [true, "Lastname is Required"]
	},
	books: {
		type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Book'}]
	},
}, { versionKey: false});

var Author = module.exports = mongoose.model("Author", AuthorSchema);

module.exports.createAuthor = function(newAuthor, callback){
     newAuthor.save(callback);
};

module.exports.getAuthorById = function(id, callback){
	var query = {_id: id};
	Author.findOne(query).populate('books').exec(callback);
};

module.exports.getAuthors = function(callback){
	var query = {};
	Author.find(query).populate('books').exec(callback);
};

module.exports.deleteAuthorById = function(id, callback){
	var query = {_id: id};
    Author.findOne(query, function(err, author){
        if(err){
            return callback(err, null);
        }    
        if(!author){
            return callback({message: "Not Found: Author not Found"}, null);
        }
        if(author.books != 0)
            return callback({message:"Conflict: Author still have books"}, null);
        Author.remove(query, callback);
    });
};

module.exports.updateAuthorById = function(author, id,  callback){
    var query = {_id: id};
    Author.findOneAndUpdate(query, {$set: author}, function(err, author){
        if(err)
            return callback(err, null);
        Author.findOne({_id : author._id}).populate("books").exec(callback);
    });
};
