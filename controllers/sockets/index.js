/**
 * Created by qs on 2016/2/25.
 */
module.exports = function(){
    return new SocketController();
}
var SocketController = function(){
}
SocketController.prototype.initConnection = function(nsp){
    this.allOnlineList = new remarkcall.SocketList();
    this.allOutlineList = new remarkcall.SocketList();
    this.nsp = nsp;
}
SocketController.prototype.handleConnection = function(handleSocketEnter,handleSocketQuit){
    var self = this;
    self.nsp.on("connection",function(socket){
        var username;
        socket.on('pushUser', function (msg) {
            console.log(msg.username,"login");
            username = msg.username;
            handleSocketEnter(self.allOnlineList,self.allOutlineList,username,socket);
            self.nsp.emit("getAllOnlineCount",{count:self.allOnlineList.getLength()});
        });
        socket.on('fetchOnlineList', function (msg) {
            var usernameList = self.allOnlineList.getUserList();
            socket.emit("getOnlineList",{list:usernameList});
        });
        socket.on("addArticle",function(msg){
            msg.flag = true;
            remarkcall.articles.add(false,"新建文档 "+remarkcall.articles.summary(),"",function(){

            });
            self.nsp.emit("newArticle",msg);
        });
        socket.on("removeArticle",function(msg){
            msg.flag = true;
            //var page = msg.page;
            remarkcall.articles.remove(msg.index);
            self.nsp.emit("newArticle",msg);
        });
        socket.on("disconnect", function () {
            handleSocketQuit(self.allOnlineList,self.allOutlineList,username,socket);
            self.nsp.emit("getAllOnlineCount",{count:self.allOnlineList.getLength()});
        });
    });
}
SocketController.prototype.getSocketList = function(isOnline){
    if(isOnline){
        return this.allOnlineList;
    }else{
        return this.allOutlineList;
    }
}
