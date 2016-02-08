/**
 * Created by qs on 2016/1/19.
 */
function login(){
    var username = $('#username').val();
    var data = { "username": username };
    $.ajax({
        url:'login',
        type:'POST',
        data:data,
        success:function(data,status) {
            if (status == "success") {
                location.href = "index";
            }
        },
        error:function(data,status,err){
            if (status == "error") {
                location.href = "login";
            }
        }
    });
}