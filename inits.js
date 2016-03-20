/**
 * Created by qs on 2016/1/22.
 */
var path = require("path");
module.exports = function(app){
    return new Initializer(app);
};
var Initializer = function(app){
    this.app = app;
    this.port = 80;
    this.routesPath = path.resolve("controllers","routes");
    this.multerPath = path.resolve("uploads");
    this.viewPath = path.resolve("views");
    this.staticsPathes = [
        path.resolve("public"),
        path.resolve("bower_components")
    ];
    this.timeStampForSavingArticle = 2000;
    this.timeStampForSavingRemarks = 2000;
    this.sessionExpire = 120;
};
Initializer.prototype.init = function(opt){
    if(opt["port"]) this.port = opt["port"];
    if(opt["view"]) this.viewPath = opt["view"];
    if(opt["routes"]) this.routesPath = opt["routes"];
    if(opt["statics"]) this.staticsPathes = opt["statics"];
    if(opt["saveTimeStamp"]){
        this.timeStampForSavingArticle = opt["saveTimeStamp"];
        this.timeStampForSavingRemarks = opt["saveTimeStamp"];
    }
    if(opt["sessionExpire"]) this.sessionExpire = opt["sessionExpire"];

    var http = require("http").Server(this.app);

    this.initModels();
    this.initStaticFiles();
    this.initSessionControl(8,this.sessionExpire);
    this.initViews();
    this.initRoutes();
    this.initSocketIO(http);

    return http;
}
Initializer.prototype.initRoutes = function(){
    var bodyParser = require("body-parser");
    var multer = require("multer");
    var self = this;
    var fileUtil = require(path.resolve("utils","files"));
    self.app.use(bodyParser.json());
    self.app.use(bodyParser.urlencoded({extended:true}));
    self.app.use(multer({ dest: self.multerPath}));

    fileUtil.getSubFilesName(self.routesPath, function(err,controller,pathname){
        if(err){
            console.err(err);
        }else{
            if(controller==="all"){
                self.app.use("/",require(pathname));
            }else {
                self.app.use("/" + controller, require(pathname));
            }
        }
    });
};
Initializer.prototype.initViews = function(){
    this.app.engine(".html",require("ejs").__express);
    this.app.set("view engine","ejs");
    this.app.set("views",this.viewPath);
};
Initializer.prototype.initStaticFiles = function(){
    var express = require("express");
    for(var i = 0 ; i<this.staticsPathes.length;i++){
        this.app.use(express.static(this.staticsPathes[i]));
    };
};
Initializer.prototype.initSessionControl = function(secretLength,expireMinute){
    var basicsUtil = require(path.resolve("utils","basics"));
    var cookieParser = require("cookie-parser");
    var session = require("express-session");
    this.app.use(cookieParser());
    this.app.use(session({
        secret: basicsUtil.getRandomString(secretLength),
        cookie: {maxAge: 60 * 1000 * expireMinute},
        resave: true,
        saveUninitialized: true
    }));
    this.app.use(function(req,res,next){
        console.log(req.url);
        if(req.url!="/login"){
            if (req.session.sign) {//����û��Ƿ��Ѿ���¼
                next();
            }else{
                res.redirect("/login");
            }
        }else{
            next();
        }
    });
};
Initializer.prototype.initModels = function(){
    remarkcall.articles = require(path.resolve("models","articles"))();
    remarkcall.SocketList = require(path.resolve("models","socketList"));
};
Initializer.prototype.initSocketIO = function(http){
    var io = require("socket.io")(http);
    var ioIndex = require(path.resolve("controllers","sockets","index"))();

    function handleSocketEnter(online,outline,username,socket){
        online.add(username,socket);
        //outline.remove(socket);
        console.log("Connect On",online.getLength());
        console.log("Connect Out",outline.getLength());
    }
    function handleSocketQuit(online,outline,username,socket){
        //outline.add(username,socket);
        online.remove(socket);
        console.log("DisConnect On",online.getLength());
        console.log("DisConnect Out",outline.getLength());
    }
    ioIndex.initConnection(io);
    ioIndex.handleConnection(handleSocketEnter,handleSocketQuit);

    remarkcall.articles.setSocketAction(function(article){
        var ioArticle = require(path.resolve("controllers","sockets","article"))();
        var nsp = io.of(article.nsp);
        console.log("setAnctiob",article.nsp,article.title);
        ioArticle.initConnection(nsp,article,ioIndex.getSocketList(true),ioIndex.getSocketList(false));
        ioArticle.handleConnection(handleSocketEnter,handleSocketQuit);
    });
    remarkcall.articles.init();
};