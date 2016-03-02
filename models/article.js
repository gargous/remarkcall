/**
 * Created by qs on 2016/2/6.
 */
var fs = require("fs");
var path = require("path");
var saveTimer;
var ArticleInfo = require("./articleInfo");
var Article = function(){
    this.filePath = path.resolve("storage","articles");
    this.title = "";
    this.index = -1;
    this.content = "";
    this.nsp = "";
    this.articleInfo = new ArticleInfo();
    this.fileName = "";
    this.editable = false;
    this.createDate;
};
Article.prototype.init = function(index,callback){
    var self = this;
    self.index = index;
    self.title = "Hello_"+index;
    self.nsp = "/article"+index;
    self.content = "Hello_"+index;
    self.fileName = path.join(self.filePath,self.index+".md");
    callback(self);
};
Article.prototype.updateTitle = function(){
    var self = this;
    var callback;
    var data = self.content;
    if(arguments.length>0){
        callback = arguments[arguments.length-1];
    }
    if(arguments.length>1){
        data = arguments[0];
    }
    if(arguments.length>2){
        data = arguments[0];
        var title = arguments[1];
        self.title = title;
        self.articleInfo.title = title;
        console.log("title",self.articleInfo.title);
        return;
    }
    var datalines = data.substr(0,100).replace(/<[^>]+>/g,",");
    datalines = datalines.split(",");
    for(var i = 0;i<datalines.length;i++){
        var title = datalines[i].trim();
        if(title!=""&&title!="\n"&&title!="\t"){
            self.title = title;
            if(callback){
                callback(title);
            }
            break;
        }
    }
};
Article.prototype.setEditable = function(editable){
    this.editable = editable;
    this.articleInfo.editable = editable;
    this.articleInfo.save(3000);
};
Article.prototype.isAbleToEdit = function(){
    return this.articleInfo.editable;
};
Article.prototype.remark = function(index,reviewer,title,remark,callback){
    var self = this;
    self.articleInfo.append(index,reviewer,title,remark,function(remarkTemp,remarkCount){
        callback(self.articleInfo.get(),remarkCount);
    });
};
Article.prototype.save = function(timeStamp){
    clearTimeout(saveTimer);
    var self = this;
    saveTimer = setTimeout(function(){
        fs.writeFile(self.fileName,self.content,{encoding:"utf-8"},function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('It\'s saved!');
        });
    },timeStamp);
};

module.exports = Article;