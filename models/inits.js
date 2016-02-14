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
        remarkcall.articles.setArticleInfo(index,require(remarkcall.getAbsolutePath("/models/articleInfo"))())
    });
    remarkcall.SocketList = require(remarkcall.getAbsolutePath("/models/socketList"));
};
Initializer.prototype.initSocketIO = function(){
    var http = require("http").Server(this.app);
    var io = require("socket.io")(http);

    var self = this;
    var allOnlineList = new remarkcall.SocketList();
    var allOutlineList = new remarkcall.SocketList();


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

    function isTooFast(oldDate){
        var dateNow = new Date();
        console.log(dateNow-oldDate);
        var detaDate = dateNow-oldDate;
        oldDate = dateNow;
        if(detaDate<1000){
            return true;
        }else{
            return false;
        }
    }

    io.on("connection",function(socket){
        var username;
        socket.on('pushUser', function (msg) {
            console.log(msg.username,"login");
            username = msg.username;
            handleSocketEnter(allOnlineList,allOutlineList,username,socket);
            io.emit("getAllOnlineCount",{count:allOnlineList.getLength()});
        });
        socket.on('fetchOnlineList', function (msg) {
            var usernameList=allOnlineList.getUserList();
            socket.emit("getOnlineList",{list:usernameList});
        });
        socket.on("addArticle",function(msg){
            msg.flag = true;
            remarkcall.articles.add(false,"新文章 "+remarkcall.articles.summary(),"");
            io.emit("newArticle",msg);
        });
        socket.on("removeArticle",function(msg){
            msg.flag = true;
            //var page = msg.page;
            remarkcall.articles.remove(msg.index);
            io.emit("newArticle",msg);
        });
        socket.on("disconnect", function () {
            handleSocketQuit(allOnlineList,allOutlineList,username,socket);
            io.emit("getAllOnlineCount",{count:allOnlineList.getLength()});
        });
    });

    remarkcall.articles.setSocketAction(function(article){
        var nsp = io.of(article.nsp);
        var onlineList = new remarkcall.SocketList();
        var outlineList = new remarkcall.SocketList();
        var chatMsgList = [];
        var chatMsgNow = "";
        var dateOld = new Date();

        nsp.on("connection", function(socket){
            var username;
            socket.on("disconnect", function () {
                handleSocketQuit(onlineList,outlineList,username,socket);
                handleSocketQuit(allOnlineList,allOutlineList,username,socket);
                nsp.emit("getOnlineCount",{count:onlineList.getLength()});
            });
            socket.on("pushUser", function (msg) {
                username = msg.username;
                handleSocketEnter(onlineList,outlineList,username,socket);
                handleSocketEnter(allOnlineList,allOutlineList,username,socket);
                nsp.emit("getOnlineCount",{count:onlineList.getLength()});
            });
            socket.on("fetchOnlineList", function (msg) {
                var usernameList=onlineList.getUserList();
                socket.emit("getOnlineList",{list:usernameList});
            });
            socket.on("fetchOnlineCount",function(msg){
                socket.emit("getOnlineCount",{count:onlineList.length});
            });
            socket.on("writeArticle", function(msg){
                socket.broadcast.emit("writeArticle", msg);
            });
            socket.on("saveArticle",function(msg){
                article.content = msg.content;
                article.save(self.timeStampForSavingArticle);
            });

            socket.on("writeRemark",function(msg){
                article.remark(msg.index,msg.reviewer,msg.title,msg.remark,function(remarks,remarkCount){
                    nsp.emit("getRemark",msg);
                    if(msg.index<0){
                        nsp.emit("newRemark",{index:remarks.length-1});
                    }

                    msg.remarkCount = remarkCount;
                    nsp.emit("getRemarkCount",msg);

                    article.articleInfo.save(self.timeStampForSavingRemarks);
                });
            });
            socket.on("fetchRemarks",function(msg){
                if(isTooFast(dateOld)){
                    return;
                }
                article.articleInfo.foreach(msg.index,function(remark){
                    socket.emit("getRemark",remark);
                });
            });
            socket.on("fetchRemarkCount",function(msg){
                var data = {};
                data.index = msg.index;
                if(article.articleInfo.get(msg.index) && article.articleInfo.get(msg.index).length>0){
                    data.remarkCount = article.articleInfo.get(msg.index).length;
                }else{
                    data.remarkCount = 1;
                }
                socket.emit("getRemarkCount",data);
            });
            socket.on("pushEditInfo",function(msg){
                if(isTooFast(dateOld)){
                    return
                }
                if(msg.editable){
                    article.setEditable(true);
                }else{
                    article.setEditable(false);
                }
                article.updateTitle();
                socket.broadcast.emit("getEditInfo", msg);
            });
            socket.on("pushChatMsg",function(msg){
                if(chatMsgNow==msg && isTooFast(dateOld)){
                    return;
                }
                console.log(msg);
                nsp.emit("getChatMsg",msg);
                chatMsgList.push(msg);
                chatMsgNow = msg;
            });
        });
    });
    return http;
};