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
    self.nsp = "/article"+index;
    self.fileName = path.join(self.filePath,self.index+".md");
    self.articleInfo.init(index,function(err){
        self.title = err ? "new Article "+index:self.articleInfo.title;
        fs.readFile(self.fileName,'utf-8',function(err,data){
            if(err){
                console.err(err);
                self.content = "Hello_"+index;
                callback(err);
                return;
            }
            self.content = data;
            callback(null);
        });
    });
};
Article.prototype.updateTitle = function(title){
    this.title = title;
    this.articleInfo.title = title;
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
                console.err(err);
                return;
            }
            console.log('It\'s saved!');
        });
    },timeStamp);
};

module.exports = Article;