//Dependencies!
var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request'); // for web-scraping
var cheerio = require('cheerio'); // for web-scraping

// Importing...
var Comments = require('../models/comments.js');
var Articles = require('../models/articles.js');

// Index Page Render (first visit to the site)
router.get('/', function(req, res) {

  // Scrape data
  res.redirect('/scrape');

});

// Articles Page Render
router.get('/articles', function(req, res) {

  // Query MongoDB for all article entries
  Articles.find().sort({_id: -1})

  // As well as populate all comments associated with the articles.
    .populate('comments')

  // Then to Handlebars they go
    .exec(function(err, doc) {
    // log any errors
    if (err) {
      console.log(err// or as json object
      );
    } else {
      var hbsObject = {
        articles: doc
      }
      res.render('index', hbsObject);
      // res.json(hbsObject)
    }
  });

});

// Web Scrape Route
router.get('/scrape', function(req, res) {

  // Grab the body of the html with request
  request('http://www.cracked.com/', function(error, response, html) {

    // Load html into cheerio
    var $ = cheerio.load(html);

    // Error handler
    var titlesArray = [];

    // Grab all of the things in "inner" with each "article" tag
    $('article .inner').each(function(i, element) {

      // Create an empty result object
      var result = {};

      // Collect the Article Title
      result.title = $(this).children('header').children('h2').text().trim() + "";

      // And link
      result.link = 'http://www.cracked.com' + $(this).children('header').children('h2').children('a').attr('href').trim();

      // And summary
      result.summary = $(this).children('div').text().trim() + "";

      // And errors
      if (result.title !== "" && result.summary !== "") {

        // Check for duplicates, asyncronysity of mongoose won't catch them.
        if (titlesArray.indexOf(result.title) == -1) {

          // Push!
          titlesArray.push(result.title);

          // But only if it doesn't already exist.
          Article.count({
            title: result.title
          }, function(err, test) {

            // If it == 0, it's not already there.
            if (test == 0) {

              // Create new entry
              var entry = new Articles(result);

              // Save above in Mongo
              entry.save(function(err, doc) {

                // log any errors
                if (err) {
                  console.log(err// that it was saved
                  );
                } else {
                  console.log(doc);
                }
              }// Log that scrape is working, but duplicates were found
              );

            } else {
              console.log('Duplicate found, not saved.')
            }

          }// Department of Redundancy Department
          );
        } else {
          console.log('Duplicate found, not saved.')// Log that scrape is working, but missing parts
        }

      } else {
        console.log('Empty Content, not saved!')
      }

    });

    // Redirect to the Articles Page
    res.redirect("/articles");

  });

});

// Add a Comment Route
router.post('/add/comment/:id', function(req, res) {

  // Collect article id
  var articleId = req.params.id;

  // And name
  var commentAuthor = req.body.name;

  // And content
  var commentContent = req.body.comment;

  // Same info as comment route
  var result = {
    author: commentAuthor,
    content: commentContent
  };

  // Using the Comment model, create a new comment entry
  var entry = new Comments(result);

  // Save the entry to the database
  entry.save(function(err, doc) {
    // Errors!
    if (err) {
      console.log(err// Or, relate the comment to the article
      );
    } else {
      // Push >.>
      Articles.findOneAndUpdate({
        '_id': articleId
      }, {
        $push: {
          'comments': doc._id
        }
      }, {new: true})
      // execute the above query
        .exec(function(err, doc) {
        // More Errors!
        if (err) {
          console.log(err);
        } else {
          // Send Success Header
          res.sendStatus(200);
        }
      });
    }
  });

});

// Delete a Comment Route
router.post('/remove/comment/:id', function(req, res) {

  // Collect comment id
  var commentId = req.params.id;

  // Find and Delete the Comment using the Id
  Comments.findByIdAndRemove(commentId, function(err, todo) {

    if (err) {
      console.log(err);
    } else {
      // Send Success Header
      res.sendStatus(200);
    }

  });

});

// Export Router to Server.js (finally!)
module.exports = router;
