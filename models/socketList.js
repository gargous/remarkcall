/**
 * Created by qs on 2016/2/12.
 */
var SocketList = function(){
    this.list = [];
};
SocketList.prototype.add = function(username,socket){
    if(!this.contain(socket)[0]){
        this.list.push({username:username,socket:socket});
    }
};
SocketList.prototype.contain = function(socket){
    for(var i=0; i<this.list.length; i++){
        if(this.list[i].socket){
            if(this.list[i].socket == socket){
                return [true,i];
            }
        }
    }
    return [false,-1];
};
SocketList.prototype.remove = function(socket){
    var contain = this.contain(socket);
    if(contain[0]){
        this.list.splice(contain[1], 1);
    }
};
SocketList.prototype.getUserList = function(){
    var usernameList=[];
    for(var i=0;i<this.list.length;i++){
        var username = this.list[i].username;
        console.log("username",username);
        if(username){
            usernameList.push({username:username})
        }
    }
    console.log("usernameList",usernameList);
    return usernameList;
};
SocketList.prototype.getLength = function(){
    return this.list.length;
};

module.exports = SocketList;