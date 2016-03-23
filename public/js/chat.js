/**
 * Created by qs on 2016/2/11.
 */
$(document).on("ready",function(){
    var chatBarOldCss ={};
    chatBarOldCss["box-shadow"] = "0px 0px 0px #888888";
    var chatBarNewCss ={};
    chatBarNewCss["box-shadow"] = "0px 0px 20px #888888";

    var chatContent = $("<ul></ul>");
    var newCommunicationsCount = 0;
    //console.log(chatBarCss);
    $("#chat-bar").on("shown.bs.popover",function(){
        setTimeout(function(){
            var scrollView = $(".chat-popover").find(".chat-content");
            updateChattingBar(0,chatBarOldCss);
            scrollView[0].scrollTop = scrollView[0].scrollHeight;
        },300);
        var chatSummit = $("#chat-summit");
        var summerNote = $("#chat-note");
        $(".chat-popover").find(".popover-content").html(chatContent.html());
        chatContent = $(".chat-popover").find(".popover-content").clone(true);
        var popup = [
            ['style', ['fontsize','bold','color', 'italic', 'underline', 'clear']],
            ['font', ['strikethrough', 'superscript', 'subscript']]
        ];
        summerNote.summernote('destroy');
        summerNote.summernote({
            dialogsFade: true,
            airMode:true,
            placeholder: 'write here...',
            popover:{
                air:popup
            }
        });
        var content = "";
        var contentOld = "";
        var dateOld = new Date();

        summerNote.on("summernote.change",function(event, contents, $editable){
            content = contents;
        });
        chatSummit.on("click",function(event){
            if(contentOld==content){
                var dateNow = new Date();
                console.log(dateNow-dateOld);
                var detaDate = dateNow-dateOld;
                dateOld = dateNow;
                if(detaDate<2000){
                    return;
                }
            }
            getSocket().emit("pushChatMsg",{name:$("#visitor").text(),content:content})
            contentOld = content;
        });

    });

    $("#chat-bar").on("hide.bs.popover",function(){
        var chatSummit = $("#chat-summit");
        var summerNote = $("#chat-note");
        chatSummit.off("click");
        summerNote.off("summernote.change");
        newCommunicationsCount = 0;
    });

    getSocket().on("getChatMsg",function(msg){
        newCommunicationsCount++;
        chatContent.append(appendRemark(msg.name,msg.content));
        //console.log(chatContent);
        if($(".chat-popover").find(".popover-content")){
            $(".chat-popover").find(".popover-content").html(chatContent.html());
        }
        var scrollView = $(".chat-popover").find(".chat-content");
        if(scrollView[0]){
            scrollView[0].scrollTop = scrollView[0].scrollHeight;
        }else{
            updateChattingBar(newCommunicationsCount,chatBarNewCss)
        }
    })
});

function updateChattingBar(count,newCSS){
    if(count>0){
        $("#chat-bar").css(newCSS);
        $("#chat-bar").parent().attr("title","new "+count+" communication");
        $("#chat-bar").parent().attr("data-original-title","new "+count+" communication");
        $("#chat-bar").parent().tooltip("show");
    }else{
        $("#chat-bar").css(newCSS);
        $("#chat-bar").parent().attr("title","Chatting!");
        $("#chat-bar").parent().attr("data-original-title","Chatting!");
    }
}