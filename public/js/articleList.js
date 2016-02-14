/**
 * Created by qs on 2016/2/12.
 */
var socket;
var articleInfo;
$(document).on("ready",function(){
    articleInfo = JSON.parse($("#articleInfo").html());
    socket = io.connect("http://www.gargouilledragon.org:50303");
    socket.on("getAllOnlineCount",function(msg){
        $("#online").text(msg.count);
    });
    socket.on("newArticle",function(msg){
        if(msg.flag){
            $("#articleList").load("article?page="+msg.page+" #articleList");
        }
    });
    socket.on("getOnlineList",function(msg){
        onGetOnlineList(msg);
    });
    socket.emit("pushUser",{username:articleInfo.visitor});
});
function addArticle(page){
    socket.emit("addArticle",{page:page});
}
function removeArticle(page,index){
    socket.emit("removeArticle",{page:page,index:index});
}
function getSocket(){
    return socket;
}



