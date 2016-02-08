/**
 * Created by qs on 2016/2/6.
 */
var fs = require("fs");
var saveTimer;
var Remarks = function(){
    this.remarks = [];
    this.index = -1;
    this.filePath = remarkcall.getAbsolutePath("/storage/remarks/");
};
Remarks.prototype.init= function(index){
    var self = this;
    self.index = index;
    self.filePath = remarkcall.getAbsolutePath("/storage/remarks/")+self.index+".json";
    fs.readFile(self.filePath,'utf-8',function(err,data){
        if(err){
            console.log(err);
            return;
        }
        self.remarks = JSON.parse(data);
        console.log(self.remarks);
    });
};
Remarks.prototype.append = function(index,reviewer,title,remark,callback){
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
Remarks.prototype.get = function(){
    var argLen = arguments.length;
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
Remarks.prototype.foreach = function(){
    var argLen = arguments.length;
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
Remarks.prototype.save = function(timeStamp){
    clearTimeout(saveTimer);
    var self = this;
    saveTimer = setTimeout(function(){
        fs.writeFile(self.filePath,JSON.stringify(self.remarks),{encoding:"utf-8"},function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Remarks were saved!');
        });
    },timeStamp);
};

module.exports = Remarks;