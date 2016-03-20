/**
 * Created by qs on 2016/1/23.
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
function handleArticleList(req,res,articleInfo){
    var page = req.param("page");
    var articlesTitle = remarkcall.articles.getTitles(true);
    articlesTitle.reverse();

    if(!page || page<=0){
        page = 1;
    }
    var articlesTitleGroup = [];
    var sliceLength = 6;
    var slicePointer = 0;

    while(slicePointer<articlesTitle.length){
        var sliceEnd = slicePointer+sliceLength;
        articlesTitleGroup.push(articlesTitle.slice(
            slicePointer,
            sliceEnd));
        slicePointer = sliceEnd;
    }
    if(page>articlesTitleGroup.length){
        page = articlesTitleGroup.length;
    }
    var titles = articlesTitleGroup[page-1];
    res.render("articleList",{
        pageCount:articlesTitleGroup.length,
        page:page,
        articleInfo:articleInfo,
        articlesTitle:titles,
        rootPath:remarkcall.ROOT_PATH
    });
}
function handleArticle(req,res,index,articleInfo){
    var article = remarkcall.articles.get(index);
    articleInfo.index = article.index;
    articleInfo.editable = article.isAbleToEdit();
    //console.log("info",articleInfo);
    res.render("article",{
        article:article,
        articleInfo:articleInfo,
        rootPath:remarkcall.ROOT_PATH
    });
}
router.get("/", function(req,res,next){
    var articleInfo = genArticleInfo(req);
    handleArticleList(req,res,articleInfo);
});
router.post("/", function(req,res){
});
router.get("/single",function(req,res){
    var index = req.param("index");
    var articleInfo = genArticleInfo(req);
    if(index && remarkcall.articles.get(index)){
        handleArticle(req,res,index,articleInfo)
    }
});

module.exports = router;