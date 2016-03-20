/**
 * Created by qs on 2016/2/6.
 */
var fs = require("fs");
var path = require("path");
var saveTimer;
var ArticleInfo = function(){
    this.remarks = [];
    this.index = -1;
    this.createDate;
    this.visitCount;
    this.editable = false;
    this.title = "";
    this.filePath = path.resolve("storage","articleInfo");
};
ArticleInfo.prototype.init= function(index,callback){
    var self = this;
    self.index = index;
    self.filePath = path.resolve("storage","articleInfo",self.index+".json");
    fs.readFile(self.filePath,'utf-8',function(err,data){
        if(err){
            console.err(err);
            self.update(true,{});
            callback(err);
            return;
        }
        var articleInfo = JSON.parse(data);
        self.update(false,articleInfo);
        callback(null);
    });
};
ArticleInfo.prototype.update = function(isFirst,opts){
    if(!isFirst){
        for(var key in this){
            var value = opts[key];
            if(value){
                this[key] = value;
            }
        }
    }
    this.createDate = this.createDate || new Date();
    this.visitCount = this.visitCount || 0;
    this.remarks = this.remarks || [];
    this.editable = this.editable || false ;
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
                console.err(err);
                return;
            }
            console.log('ArticleInfo were saved!');
        });
    },timeStamp);
};

module.exports = ArticleInfo;