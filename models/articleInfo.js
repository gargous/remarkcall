/**
 * Created by qs on 2016/2/6.
 */
var fs = require("fs");
var saveTimer;
var ArticleInfo = function(){
    this.remarks = [];
    this.index = -1;
    this.createDate;
    this.visitCount;
    this.editable;
    this.filePath = remarkcall.getAbsolutePath("/storage/articleInfo/");
};
ArticleInfo.prototype.init= function(index){
    var self = this;
    self.index = index;
    self.filePath = remarkcall.getAbsolutePath("/storage/articleInfo/")+self.index+".json";
    fs.readFile(self.filePath,'utf-8',function(err,data){
        if(err){
            console.log(err);
            self.createDate = new Date();
            self.visitCount = 0;
            self.remarks = [];
            self.editable = false;
            return;
        }
        var articleInfo = JSON.parse(data);
        self.createDate = articleInfo["createDate"];
        self.visitCount = articleInfo["visitCount"];
        self.remarks = articleInfo["remarks"];
        self.editable = articleInfo["editable"];
        if(!self.createDate){
            self.createDate = new Date();
        }
        if(!self.visitCount){
            self.visitCount = 0;
        }
        if(!self.remarks){
            self.remarks = [];
        }
    });
};
ArticleInfo.prototype.append = function(index,reviewer,title,remark,callback){
    if(index<this.remarks.length){
        var remarkTemp = {reviewer:reviewer,title:title,remark:remark};
        var remarkCount = 1;
        if(index<0){
            var remarksTemp = [];
            remarksTemp.push(remarkTemp);
            this.remarks.push(remarksTemp);
        }else{
            if(this.remarks[index]) {
                this.remarks[index].push(remarkTemp);
                remarkCount = this.remarks[index].length;
            }
        }
        callback(remarkTemp,remarkCount);
    }
};
ArticleInfo.prototype.get = function(){
    var argLen = arguments.length;
    if(!this.remarks){
        return
    }
    switch (argLen){
        case 0:
            return this.remarks;
        case 1:
            var index = arguments[0];
            if(index>=0 && index<this.remarks.length){
                return this.remarks[index];
            }
        case 2:
            var index = arguments[0];
            var item = arguments[1];
            if(index>=0&&index<this.remarks.length){
                var remark = this.remarks[index];
                if(remark && item>=0 && item<remark.length){
                    return remark[item];
                }
            }
        default:
    }
};
ArticleInfo.prototype.foreach = function(){
    var argLen = arguments.length;
    if(!this.remarks){
        return
    }
    if(argLen>0){
        var callback = arguments[arguments.length-1];
        switch (argLen){
            case 1:
                this.remarks.forEach(function(data){
                    callback(data);
                });
                break;
            case 2:
                if(this.remarks[arguments[0]]){
                    this.remarks[arguments[0]].forEach(function(data){
                        callback(data);
                    });
                }
                break;
            default:
                break;
        }
    }
};
ArticleInfo.prototype.save = function(timeStamp){
    clearTimeout(saveTimer);
    var self = this;
    saveTimer = setTimeout(function(){
        fs.writeFile(self.filePath,JSON.stringify(self),{encoding:"utf-8"},function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('ArticleInfo were saved!');
        });
    },timeStamp);
};

module.exports = ArticleInfo;