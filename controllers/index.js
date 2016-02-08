/**
 * Created by qs on 2016/1/22.
 */
var express = require('express');
var router = express.Router();

router.get("/", function(req,res){
    var session = req.session;
    var articles = remarkcall.articles;
    res.render("index",{
        user : session.name,
        author : session.author,
        articles : articles
    });
});
router.get("/cookies", function(req,res){
    if (req.cookies.isVisit) {
        console.log(req.cookies);
        res.send("Welcome for coming again");
    } else {
        res.cookie('isVisit', 1, {maxAge: 30 * 1000});
        res.send("Welcome for the first time");
    }
});
module.exports = router;