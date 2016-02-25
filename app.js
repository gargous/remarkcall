global.remarkcall = {};
remarkcall.ROOT_PATH = __dirname;
remarkcall.getAbsolutePath = function(relativePath){
    return path.join(remarkcall.ROOT_PATH,relativePath);
};

var express = require("express");
var path = require("path");
var app = express();
var initializer = require(remarkcall.getAbsolutePath("inits"))(app);
initializer.init({port:80}).listen(initializer.port,function(){
    console.log("Server Started At "+initializer.port);
    remarkcall.articles.init();
});