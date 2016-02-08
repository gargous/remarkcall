global.remarkcall = {};
remarkcall.ROOT_PATH = __dirname;
remarkcall.getAbsolutePath = function(relativePath){
    return path.join(remarkcall.ROOT_PATH,relativePath);
};

var express = require("express");
var path = require("path");
var app = express();
var initializer = require(remarkcall.getAbsolutePath("models/inits"))(app);
initializer.initModels();
initializer.initStaticFiles();
initializer.initSessionControl(8,60);
initializer.initViews();
initializer.initControllers();

initializer.initSocketIO().listen(initializer.port,function(){
    console.log("Server Started At "+initializer.port);
    remarkcall.articles.init();
});