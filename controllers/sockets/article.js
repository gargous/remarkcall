/**
 * Created by qs on 2016/2/25.
 */
module.exports = function(){
    return new SocketController();
}
var SocketController = function(){
}

SocketController.prototype.initConnection = function(nsp,article,allOnlineList,allOutlineList){
    this.onlineList = new remarkcall.SocketList();
    this.outlineList = new remarkcall.SocketList();
    this.allOnlineList = allOnlineList;
    this.allOutlineList = allOutlineList;
    this.nsp = nsp;
    this.article = article;

    this.chatMsgList = [];
    this.chatMsgNow = "";
    this.oldDate = new Date();
}

SocketController.prototype.handleConnection = function(handleSocketEnter,handleSocketQuit){
    var self = this;
    self.nsp.on("connection", function(socket){
        var username;
        socket.on("disconnect", function () {
            handleSocketQuit(self.onlineList,self.outlineList,username,socket);
            handleSocketQuit(self.allOnlineList,self.allOutlineList,username,socket);
            self.nsp.emit("getOnlineCount",{count:self.onlineList.getLength()});
        });
        socket.on("pushUser", function (msg) {
            username = msg.username;
            handleSocketEnter(self.onlineList,self.outlineList,username,socket);
            handleSocketEnter(self.allOnlineList,self.allOutlineList,username,socket);
            self.nsp.emit("getOnlineCount",{count:self.onlineList.getLength()});
        });
        socket.on("fetchOnlineList", function (msg) {
            var usernameList=self.onlineList.getUserList();
            socket.emit("getOnlineList",{list:usernameList});
        });
        socket.on("fetchOnlineCount",function(msg){
            socket.emit("getOnlineCount",{count:self.onlineList.length});
        });
        socket.on("writeArticle", function(msg){
            socket.broadcast.emit("writeArticle", msg);
        });
        socket.on("saveArticle",function(msg){
            self.article.content = msg.content;
            self.article.save(self.timeStampForSavingArticle);
        });

        socket.on("writeRemark",function(msg){
            self.article.remark(msg.index,msg.reviewer,msg.title,msg.remark,function(remarks,remarkCount){
                self.nsp.emit("getRemark",msg);
                if(msg.index<0){
                    self.nsp.emit("newRemark",{index:remarks.length-1});
                }

                msg.remarkCount = remarkCount;
                self.nsp.emit("getRemarkCount",msg);

                self.article.articleInfo.save(self.timeStampForSavingRemarks);
            });
        });
        socket.on("fetchRemarks",function(msg){
            if(self.isTooFast()){
                return;
            }
            self.article.articleInfo.foreach(msg.index,function(remark){
                socket.emit("getRemark",remark);
            });
        });
        socket.on("fetchRemarkCount",function(msg){
            var data = {};
            data.index = msg.index;
            if(self.article.articleInfo.get(msg.index) && self.article.articleInfo.get(msg.index).length>0){
                data.remarkCount = self.article.articleInfo.get(msg.index).length;
            }else{
                data.remarkCount = 1;
            }
            socket.emit("getRemarkCount",data);
        });
        socket.on("pushEditInfo",function(msg){
            if(self.isTooFast()){
                return
            }
            if(msg.editable){
                self.article.setEditable(true);
            }else{
                self.article.setEditable(false);
            }
            self.article.updateTitle();
            socket.broadcast.emit("getEditInfo", msg);
        });
        socket.on("pushChatMsg",function(msg){
            if(self.chatMsgNow==msg && self.isTooFast()){
                return;
            }
            console.log(msg);
            self.nsp.emit("getChatMsg",msg);
            self.chatMsgList.push(msg);
            self.chatMsgNow = msg;
        });
    });
}

SocketController.prototype.isTooFast = function(){
    var dateNow = new Date();
    console.log(dateNow-this.oldDate);
    var detaDate = dateNow-this.oldDate;
    this.oldDate = dateNow;
    if(detaDate<1000){
        return true;
    }else{
        return false;
    }
}