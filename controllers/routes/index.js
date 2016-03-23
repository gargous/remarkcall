/**
 * Created by qs on 2016/1/22.
 */
var router = require("express").Router();
function genArticleInfo(req){
    var articleInfo = {};
    articleInfo.author = req.session.author;
    articleInfo.visitor = req.session.name;
    if(req.session.name==req.session.author){
        articleInfo.isAuthor = true;
    }else{
        articleInfo.isAuthor = false;
    }
    return articleInfo;
}
router.get("/", function(req,res){
    //var session = req.session;
    var articles = remarkcall.articles;
    var mainInfo = genArticleInfo(req);
    mainInfo.articleCount = articles.summary();
    res.render("index",{
        articleInfo:mainInfo,
        //rootPath:remarkcall.ROOT_PATH
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