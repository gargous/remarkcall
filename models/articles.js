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
    this.length = 0;
};
Articles.prototype.init= function(){
    var fileUtil = require(remarkcall.getAbsolutePath("utils/files"));
    var self = this;
    fileUtil.getSubFilesName(this.filePath,function(index,content){
        try{
            fs.readFile(content,'utf-8',function(err,data){
                if(err){
                    console.log(err);
                    return;
                }
                self.add(index,"Hello_"+index,"");
                self.updateTitle(index,data,function(title){
                    self.resetArticle(index,title,data);
                });
            });
        }catch(e){

        }
    });
};
Articles.prototype.add = function(index_,title,content){
    var dateNow = new Date();
    var index = "time-"+
        dateNow.getYear()+"-"+
        (dateNow.getMonth()+1)+"-"+
        dateNow.getDate()+"-"+
        dateNow.getHours()+"-"+
        dateNow.getMinutes()+"-"+
        dateNow.getSeconds();
    if(index_){
        index = index_;
    }

    var article = new Article();
    article.init(index);
    if(title!=""){
        article.title = title;
    }
    if(content!=""){
        article.content = content;
    }
    this.articles[index] = article;
    this.socketAction(article);
    this.length++;
};
Articles.prototype.remove = function(index){
    if(this.articles[index]){
        this.length--;
        delete this.articles[index];
    }
};
Articles.prototype.get = function(index){
    if(this.articles[index]){
        return this.articles[index]
    }
};
Articles.prototype.updateTitle = function(index,data,callback){
    this.articles[index].updateTitle(data,callback);
};
Articles.prototype.getTitles = function(withIndex){
    var titles=[];
    this.foreach(function(article){
        if(withIndex){
            titles.push({title:article.title,index:article.index});
        }else{
            titles.push(article.title);
        }
    });
    return titles;
};
Articles.prototype.updateArticle = function(index,content){
    if(this.articles[index]){
        this.articles[index].content = content;
        this.save(index,content,5000);
    }
};
Articles.prototype.resetArticle = function(index,title,content){
    if(this.articles[index]){
        this.articles[index].title = title;
        this.articles[index].content = content;
    }else{
        this.add(index,title,content);
    }
};
Articles.prototype.setArticleInfo = function(index,info){
    if(this.articles[index]){
        this.articles[index].articleInfo = info;
    }
};
Articles.prototype.getArticleInfo = function(index){
    if(this.articles[index]){
        return this.articles[index].articleInfo;
    }
};
Articles.prototype.foreach = function(){
    var self = this;
    switch (arguments.length){
        case 1:
            var callback = arguments[0];
            for(key in self.articles){
                callback(self.articles[key]);
            }
            break;
        default :
            break;
    }

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
Articles.prototype.summary = function(){
    return this.length;
};