var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");


var db = require("./models");

var PORT = 2252;


var app = express();

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/mongoScraperAssignment", { useNewUrlParser: true });

//send handlebars file to the path localhost:2252/
app.get("/", function(req,res){
    res.render("home");
})
app.get("/comments", function(req, res) {
  db.Comment.find({}) 
    .then( comments => res.json(comments))
  });
app.get("/scrape", function(req, res) {

    //grab html data from the time.com website with use of axios
    axios.get("http://time.com/").then(function(response) {

      var $ = cheerio.load(response.data);

      $("div.headline").each(function(i, element) {
        //create empty object for placing info we want from html
        var result = {};

        //console logging quick snippet of article and the link to the article from time.com
        console.log($(element).find("a").text());
        console.log("http://time.com" + $(element).find("a").attr("href"));

        //place info grabbed from html into empty results object
        result.title = $(element).find("a").text();
        result.link = "http://time.com" + $(element).find("a").attr("href");

        //place the result object into the mongo db
        db.Article.create(result)
          .then(function(dbarticles) {

            console.log(dbarticles);
          })
          .catch(function(err) {

            console.log(err);
          });
      });
    });
});

//get articles from the db to send to the DOM
app.get("/articles", function(req, res) {
    db.Article.find({}) 
      .then( articles => res.json(articles))
});
//post route to apply a comment to an article
app.post("/articles/:id", function(req, res) {
    db.Comment.create(req.body)

      .then( dbComment => db.Article.findOneAndUpdate(
              {_id:req.params.id},
              {$set:{comment:dbComment._id}})    
      )
      .then(dbArticle => res.json(dbArticle))
      .catch( err => res.json(500, err))
});



app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
}); 