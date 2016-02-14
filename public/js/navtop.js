/**
 * Created by qs on 2016/2/12.
 */
function getOnlineList(){
    getSocket().emit("fetchOnlineList",{});
}
function onGetOnlineList(msg){
    var onlineList = msg.list;
    $("#onlineListMenu").html("");
    if(onlineList && onlineList.length){
        for(var i=0;i<onlineList.length;i++){
            var newItem = $("<li><a>"+onlineList[i].username+"</a></li>");
            $("#onlineListMenu").append(newItem);
        }
    }
}