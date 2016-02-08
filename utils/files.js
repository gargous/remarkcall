/**
 * Created by qs on 2016/1/22.
 */
var fs = require("fs");
var path = require('path');

var getSubFiles = function(dir,callback){
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        var pending = list.length;
        if (!pending) return callback(null, null,null);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                }else{
                    callback(null, file,stat);
                }
            });
        });
    });
};
module.exports.getSubFiles = getSubFiles;
module.exports.getSubFilesName = function(dir,callback){
    getSubFiles(dir,function(err,file){
        if(!err){
            var controllerName = path.basename(file).split(".")[0];
            callback(controllerName,file);
        }else{
            console.log(err);
        }
    });
};