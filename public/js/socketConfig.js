/**
 * Created by qs on 2016/2/28.
 */
function getSocketConnection(isAuthor,nsp){
    var socket;
    if(isAuthor){
        console.log("login");
        socket = io.connect("http://localhost:8099"+nsp);
    }else{
        console.log("visit");
        socket = io.connect("http://www.gargouilledragon.org:49455"+nsp);
    }
    return socket;
}