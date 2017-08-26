//dependencies and variables
var moment = require("moment");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ArticleSchema = new Schema({

  // Title of Article
  title: {
    type: String,
    required: true
  },

  // Link to Article
  link: {
    type: String,
    required: true
  },

  // Summary of Article
  summary: {
    type: String,
    required: true
  },

  // Date of article scrape in Moment.js format
  updated: {
    type: String,
    default: moment().format('MMMM Do YYYY, h:mm A')
  },

  // Create a relation with the Comment model
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ]

});

// Create the Article model with Mongoose
var Article = mongoose.model('Article', ArticleSchema);

// Export the Model
module.exports = Article;
