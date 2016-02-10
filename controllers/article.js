/**
 * Created by qs on 2016/1/23.
 */
var express = require('express');
var router = express.Router();
router.get("/", function(req,res){
    var article = remarkcall.articles.get(req.param("index"));
    console.log(article.editable);
    if(req.session.name==req.session.author){
        article.isAuthor = true;
    }else{
        article.isAuthor = false;
    }
    article.author = req.session.author;
    article.visitor = req.session.name;

    var articleInfo = {};
    articleInfo.author = req.session.author;
    articleInfo.visitor = req.session.name;
    articleInfo.isAuthor = article.isAuthor;
    articleInfo.index = article.index;
    articleInfo.editable = article.editable;

    res.render("article",{article:article,articleInfo:articleInfo});
});
router.post("/", function(req,res){
});
module.exports = router;