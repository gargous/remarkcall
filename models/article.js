/**
 * Created by qs on 2016/2/6.
 */
var fs = require("fs");
var saveTimer;
var Remarks = require("./remarks");
var Article = function(){
    this.filePath = remarkcall.getAbsolutePath("/storage/articles/");
    this.title = "";
    this.index = -1;
    this.content = "";
    this.nsp = "";
    this.remarks = new Remarks();
};
Article.prototype.init = function(index){
    this.index = index;
    this.title = "Hello_"+index;
    this.nsp = "/article"+index;
    this.remarks.init(index);
};
Article.prototype.remark = function(index,reviewer,title,remark,callback){
    var self = this;
    self.remarks.append(index,reviewer,title,remark,function(remarkTemp,remarkCount){
        callback(self.remarks.get(),remarkCount);
    });
};
Article.prototype.save = function(timeStamp){
    clearTimeout(saveTimer);
    var self = this;
    saveTimer = setTimeout(function(){
        fs.writeFile(self.filePath+self.index,self.content,{encoding:"utf-8"},function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('It\'s saved!');
        });
    },timeStamp);
};

module.exports = Article;