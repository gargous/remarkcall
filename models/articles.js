/**
 * Created by qs on 2016/1/24.
 */
module.exports = function(){
    return new Articles();
};
var fs = require("fs");
var Article = require("./article");
var Articles = function(){
    this.filePath = remarkcall.getAbsolutePath("/storage/articles/");
    this.articles = [];
    this.socketAction = function(article){};
};
Articles.prototype.init= function(){
    var fileUtil = require(remarkcall.getAbsolutePath("utils/files"));
    var self = this;
    if(self.articles.length==0){
        for(var i=0;i<10;i++){
            self.add("Hello_"+i,"");
        }
    }
    fileUtil.getSubFilesName(this.filePath,function(index,content){
        fs.readFile(content,'utf-8',function(err,data){
            if(err){
                console.log(err);
                return;
            }
            self.updateTitle(index,data,function(title){
                self.resetArticle(index,title,data);
            });
        });
    });
};
Articles.prototype.add = function(title,content){
    var index = this.articles.length;
    var article = new Article();
    article.init(index);
    article.content = content;
    this.articles.push(article);
    this.socketAction(article);
};
Articles.prototype.get = function(index){
    if(index<this.articles.length && index>=0){
        return this.articles[index]
    }
};
Articles.prototype.updateTitle = function(index,data,callback){
    var self = this;
    var datalines = data.substr(0,100).replace(/<[^>]+>/g,",");
    datalines = datalines.split(",");
    for(var i = 0;i<datalines.length;i++){
        var title = datalines[i].trim();
        if(title!=""&&title!="\n"&&title!="\t"){
            self.articles[index].title = title;
            callback(title);
            break;
        }
    }
};
Articles.prototype.setArticle = function(index,content){
    if(index<this.articles.length && index>=0){
        this.articles[index].content = content;
        this.save(index,content,5000);
    }
};
Articles.prototype.resetArticle = function(index,title,content){
    if(index<this.articles.length && index>=0){
        this.articles[index].title = title;
        this.articles[index].content = content;
    }else{
        this.add(title,content);
    }
};
Articles.prototype.setRemarks = function(index,remarks){
    if(index<this.articles.length && index>=0){
        this.articles[index].remarks = remarks;
    }
};
Articles.prototype.getRemarks = function(index){
    if(index<this.articles.length && index>=0){
        return this.articles[index].remarks;
    }
};
Articles.prototype.foreach = function(callback){
    this.articles.forEach(function(article){
        callback(article);
    });
};
Articles.prototype.save = function(index,content,timeStamp){
    var self = this;
    var article = self.get(index);
    article.content = content;
    article.save(timeStamp);
};
Articles.prototype.setSocketAction = function(action){
    this.socketAction = action;
};