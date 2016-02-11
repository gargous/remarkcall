/**
 * Created by qs on 2016/2/11.
 */
$(document).on("ready",function(){
    var chatBarOldCss ={};
    chatBarOldCss["background"] = "#5e5e5e";
    chatBarOldCss["box-shadow"] = "0px 0px 0px #888888";
    var chatBarNewCss ={};
    chatBarNewCss["background"] = "#6e6e6e";
    chatBarNewCss["box-shadow"] = "0px 0px 20px #888888";

    var chatContent = $("<ul></ul>");
    //console.log(chatBarCss);
    $("#chat-bar").on("shown.bs.popover",function(){
        $("#chat-bar").css(chatBarOldCss);
        var chatSummit = $("#chat-summit");
        var summerNote = $("#chat-note");
        $(".chat-popover").find(".popover-content").html(chatContent.html());
        chatContent = $(".chat-popover").find(".popover-content").clone(true);
        var popup = [
            ['style', ['fontsize','bold','color', 'italic', 'underline', 'clear']],
            ['font', ['strikethrough', 'superscript', 'subscript']]
        ];
        summerNote.summernote({
            dialogsFade: true,
            airMode:true,
            placeholder: 'write here...',
            popover:{
                air:popup
            }
        });
        var content = "";
        //summerNote.summernote('lineHeight', 1.5);
        summerNote.on("summernote.change",function(event, contents, $editable){
            content = contents;
        });
        chatSummit.on("click",function(){
            getSocket().emit("pushChatMsg",{name:$("#visitor").text(),content:content})
        });

    });

    $("#chat-bar").on("hidden.bs.popover",function(){
        var chatSummit = $("#chat-summit");
        var summerNote = $("#chat-note");
        chatSummit.off("click");
        summerNote.off("summernote.change");
    });

    getSocket().on("getChatMsg",function(msg){
        chatContent.append(appendRemark(msg.name,msg.content));
        //console.log(chatContent);
        if($(".chat-popover").find(".popover-content")){
            $(".chat-popover").find(".popover-content").html(chatContent.html());
        }
        var scrollView = $(".chat-popover").find(".chat-content");
        if(scrollView[0]){
            scrollView[0].scrollTop = scrollView[0].scrollHeight;
        }else{
            $("#chat-bar").css(chatBarNewCss);
        }
    })
});