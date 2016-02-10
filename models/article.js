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
    this.fileName = "";
    this.editable = false;
};
Article.prototype.init = function(index){
    this.index = index;
    this.title = "Hello_"+index;
    this.nsp = "/article"+index;
    this.remarks.init(index);
    this.content = "Hello_"+index;
    this.fileName = this.filePath+this.index+".md";
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