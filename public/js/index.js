/**
 * Created by qs on 2016/1/19.
 */
var socket;
$(document).on("ready",function(){
    socket = io.connect("http://www.gargouilledragon.org:50303");
    socket.on("getAllOnlineCount",function(msg){
        console.log(msg);
        $("#online").text(msg.count);
    });
    var articleInformation = JSON.parse($("#articleInfo").html());
    socket.on("getOnlineList",function(msg){
        onGetOnlineList(msg);
    });
    socket.emit("pushUser",{username:articleInformation.visitor});
});
function getSocket(){
    return socket;
}