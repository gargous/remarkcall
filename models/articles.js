/**
 * Created by qs on 2016/1/24.
 */
module.exports = function(){
    return new Articles();
};
var fs = require("fs");
var path = require("path");
var Articles = function(){
    this.filePath = path.resolve("storage","articles");
    this.articles = [];
    this.socketAction = function(article){};
    this.length = 0;
};
Articles.prototype.init = function(callback){
    var fileUtil = require(path.resolve("utils","files"));
    var self = this;
    fileUtil.getSubFilesName(self.filePath,function(err,index,content){
        if(!err){
            console.log("add",index,self.filePath);
            self.add(index,callback);
        };
    });
};
Articles.prototype.genIndex = function(index){
    if(!index){
        var dateNow = new Date();
        index = "time-"+ dateNow.getYear()+"-"+
            (dateNow.getMonth()+1)+"-"+
            dateNow.getDate()+"-"+
            dateNow.getHours()+"-"+
            dateNow.getMinutes()+"-"+
            dateNow.getSeconds();
    }
    return index;
}
Articles.prototype.add = function(index_,callback){
    var self = this;
    var index = self.genIndex(index_);
    var article = new (require("./article"))();
    article.init(index,function(err){
        self.articles[index] = article;
        self.socketAction(article);
        self.length++;
        if(typeof callback == "function")callback(article);
    });
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
Articles.prototype.updateTitle = function(index,title,callback){
    this.articles[index].updateTitle("",title,callback);
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