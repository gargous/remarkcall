global.remarkcall = {};
var express = require("express");
var path = require("path");
var app = express();
var initializer = require(path.resolve("inits"))(app);
initializer.init({port:8099}).listen(initializer.port,function(){
    console.log("Server Started At "+initializer.port);
    //remarkcall.articles.init(function(){});
});