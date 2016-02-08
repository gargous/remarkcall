/**
 * Created by qs on 2016/1/23.
 */
var express = require('express');
var router = express.Router();
router.get("/", function(req,res){
    var article = remarkcall.articles.get(req.param("index"));

    if(req.session.name==req.session.author){
        article.isAuthor = "ISAUTHOR";
    }else{
        article.isAuthor = "";
    }
    article.author = req.session.author;
    article.visitor = req.session.name;
    res.render("article",article);
});
router.post("/", function(req,res){
});
module.exports = router;