/**
 * Created by qs on 2016/1/22.
 */
module.exports = function(app){
    return new Initializer(app);
};
var Initializer = function(app){
    this.app = app;
    this.port = 80;
    this.controllersPath = remarkcall.getAbsolutePath("controllers");
    this.multerPath = remarkcall.getAbsolutePath("uploads");
    this.viewPath = remarkcall.getAbsolutePath("views");
    this.staticsPathes = [
        remarkcall.getAbsolutePath("public"),
        remarkcall.getAbsolutePath("bower_components")
    ];
    this.timeStampForSavingArticle = 2000;
    this.timeStampForSavingRemarks = 2000;
};
Initializer.prototype.initControllers = function(){
    var bodyParser = require("body-parser");
    var multer = require("multer");
    var self = this;
    var fileUtil = require(remarkcall.getAbsolutePath("/utils/files"));
    self.app.use(bodyParser.json());
    self.app.use(bodyParser.urlencoded({extended:true}));
    self.app.use(multer({ dest: self.multerPath}));

    fileUtil.getSubFilesName(self.controllersPath, function(controller,pathname){
        try{
            if(controller==="all"){
                self.app.use("/",require(pathname));
            }else {
                self.app.use("/" + controller, require(pathname));
            }
        }catch(e){
            console.log(e);
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
    var basicsUtil = require(remarkcall.getAbsolutePath("/utils/basics"));
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
    remarkcall.articles = require(remarkcall.getAbsolutePath("/models/articles"))();
    remarkcall.articles.foreach(function(data,index){
        remarkcall.articles.setRemarks(index,require(remarkcall.getAbsolutePath("/models/remarks"))())
    });
};
Initializer.prototype.initSocketIO = function(){
    var http = require("http").Server(this.app);
    var io = require("socket.io")(http);

    var self = this;
    var allOnlineList = [];
    var allOutlineList = [];

    io.on("connection",function(socket){

        if(allOnlineList.indexOf(socket)<=-1){
            allOnlineList.push(socket);
        }
        if(allOutlineList.indexOf(socket)>-1){
            allOutlineList.splice(allOutlineList.indexOf(socket), 1);
        }
        console.log("Connect",allOnlineList.length);
        io.emit("getAllOnlineCount",{count:allOnlineList.length});

        socket.on('disconnect', function () {
            allOnlineList.splice(allOnlineList.indexOf(socket), 1);
            if(allOutlineList.indexOf(socket)<=-1){
                allOutlineList.push(socket);
            }
            console.log("DisConnect",allOnlineList.length);
            io.emit("getAllOnlineCount",{count:allOnlineList.length});
        });
    });

    remarkcall.articles.setSocketAction(function(article){
        var nsp = io.of(article.nsp);
        var onlineList = [];
        var outlineList = [];
        nsp.on("connection", function(socket){
            if(onlineList.indexOf(socket)<=-1){
                onlineList.push(socket);
            }
            if(outlineList.indexOf(socket)>-1){
                outlineList.splice(outlineList.indexOf(socket), 1);
            }
            nsp.emit("getOnlineCount",{count:onlineList.length});
            socket.on('disconnect', function () {
                onlineList.splice(onlineList.indexOf(socket), 1);
                if(outlineList.indexOf(socket)<=-1){
                    outlineList.push(socket);
                }
                nsp.emit("getOnlineCount",{count:onlineList.length});
            });

            socket.on("writeArticle", function(msg){
                socket.broadcast.emit("writeArticle", msg);
            });
            socket.on("saveArticle",function(msg){
                article.content = msg.content;
                article.save(self.timeStampForSavingArticle);
            });
            socket.on("fetchOnlineCount",function(msg){
                socket.emit("getOnlineCount",{count:onlineList.length});
            });
            socket.on("writeRemark",function(msg){
                article.remark(msg.index,msg.reviewer,msg.title,msg.remark,function(remarks,remarkCount){
                    nsp.emit("getRemark",msg);
                    if(msg.index<0){
                        nsp.emit("newRemark",{index:remarks.length-1});
                    }

                    msg.remarkCount = remarkCount;
                    nsp.emit("getRemarkCount",msg);

                    article.remarks.save(self.timeStampForSavingRemarks);
                });
            });
            socket.on("fetchRemarks",function(msg){
                article.remarks.foreach(msg.index,function(remark){
                    socket.emit("getRemark",remark);
                });
            });
            socket.on("fetchRemarkCount",function(msg){
                var data = {};
                data.index = msg.index;
                if(article.remarks.get(msg.index) && article.remarks.get(msg.index).length>0){
                    data.remarkCount = article.remarks.get(msg.index).length;
                }else{
                    data.remarkCount = 1;
                }
                socket.emit("getRemarkCount",data);
            });
            socket.on("pushEditInfo",function(msg){
               if(msg.editable){
                   article.setEditable(true);
               }else{
                   article.setEditable(false);
               }
                socket.broadcast.emit("getEditInfo", msg);
            });
        });
    });
    return http;
};