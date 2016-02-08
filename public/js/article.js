/**
 * Created by qs on 2016/1/27.
 */
var updateTimer = null;
var remarkSelections = [];
var differentOfArticle;
var oldArticleHTML;
var reviewer;
var socket;
var isAuthor;
$(document).on("ready",function(){
    reviewer = $("#visitor").text();
    init();
    handleSocket();
    handleEditor($("#summernote"));
    isAuthor = $("#isAuthor").text();
    if(isAuthor==""){
        $('#summernote').summernote('disable');
    }
    //editsFunc();
});

function init(){
    differentOfArticle = new diffDOM();
    oldArticleHTML = $("#summernote").html();
    socket = io.connect("http://www.gargouilledragon.org:50303/article"+$("#index").html());

    $("#summernote").summernote({
        dialogsFade: true,
        toolbar: [
            ['misc',['undo','redo']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['font', ['strikethrough', 'superscript', 'subscript']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['insert', ['round']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['highlight', ['highlight']],
            ["Insert",["picture","link","vedio","table"]]
        ]
    });

    $(".note-editable").find(".remark").on("click",function() {
        showFloatingRemark($(this));
    });
    $(".note-editable").find(".remark").each(function(key,elem){
        socket.emit("fetchRemarkCount",{index:$(elem).attr("remark-index")});
    });

    //;
}

function handleSocket(){
    socket.on("writeArticle",function(msg){
        differentOfArticle.apply($(".note-editable")[0], msg);
        $(".note-editable").find(".remark").on("click",function() {
            showFloatingRemark($(this));
        });
    });
    socket.on("disconnect",function(msg){
        window.location.reload();
    });
    socket.on("getRemark",function(msg){
        var modal = $("#remarkFloat");
        var reviewer = msg.reviewer;
        var title = msg.title;
        var remark = msg.remark;
        if(msg.remark!=""){
            modal.trigger("remark",[reviewer,title,remark]);
        }
    });
    socket.on("getRemarkCount",function(msg){
        $(".note-editable").find(".remark").each(function(key,elem){
            var $elem = $(elem);
            if($elem.attr("remark-index")==msg.index){
                $elem.attr("remark-count",msg.remarkCount);
            }
        });
    });
}

function sendArticle(contents){
    if(contents!=oldArticleHTML){
        var different = getHtmlDiff(contents,oldArticleHTML,differentOfArticle);
        console.log(different);
        socket.emit("writeArticle",different);
        oldArticleHTML = contents;
    }
    saveArticle($("#index").html(),contents);
}

function handleEditor(editor){

    editor.on('summernote.enter', function(ew, event, $editable) {
        event.preventDefault();
        console.log(window.getSelection());
        editor.summernote('insertNode', $("<br />")[0]);
    });
    editor.on("summernote.change", function(event, contents, $editable) {
        sendArticle(contents);
    });
    $(".note-editable").on("mouseup",function(event){
        if(3==event.which){
            gotTheSameRemark(function(got,selection){
                if(got){
                    showFloatingRemark(selection);
                }else{
                    showDialogRemark(selection);
                }
            });
        }
    });
}

function editsFunc(){
    var differentOfParagraph = new diffDOM();
    var editWrap = $("#editWrapper");
    var paragraphs = [];
    for(var i = 0; i<editWrap.children.length;i++){
        paragraphs.push({});
    }

    var edits = editWrap.find("div");
    console.log("edits",edits);

    edits.on("input",function(event){
        var self = $(this);
        var content = self.html();
        var oldContent = paragraphs[self.index()].oldHtml;
        if(oldContent && content!=oldContent){
            var different = getHtmlDiff(content,oldContent,differentOfParagraph);
            var differentJsonStr = JSON.stringify(different);
            if(catchAddedTag(different,"BR")){
                var selfChildren = self.children();
                selfChildren[selfChildren.length-1].remove();
                if(self.next()){
                    self.next().focus();
                }
            }
            paragraphs[self.index()].oldHtml = content;
        }
    });
    edits.on("focus",function(event){
        var self = $(this);
        console.log("index",self.index());
        paragraphs[self.index()].oldHtml = self.html();
    });

    function catchAddedTag(different,tagName){
        for(var i=0;i<different.length;i++){
            var diffVal = different[i];
            if(diffVal.action && diffVal.action=="addElement"){
                if(diffVal.element){
                    return hasChildWithTag(diffVal.element,tagName);
                }
            }
        }
        return false;
    }
    function hasChildWithTag(node,tagName){
        if(node.childNodes){
            for(var i=0;i<node.childNodes.length;i++){
                var childNode = node.childNodes[i];
                if(tagName==childNode.nodeName){
                    return true;
                }else{
                    return hasChildWithTag(childNode,tagName);
                }
            }
        }
    }
}

function updateRemark(){
    //modalDialog
}

function showFloatingRemark(selectedRange){
    var remarkIndex = selectedRange.attr("remark-index");
    var remarkTitle = selectedRange.text();
    showRemark(remarkTitle,function(remarks){
        socket.emit("writeRemark",{reviewer:reviewer,index:remarkIndex,title:remarkTitle,remark:remarks});
        socket.emit("fetchRemarkCount",{index:remarkIndex});
    });
    socket.emit("fetchRemarks",{index:remarkIndex});
}

function showDialogRemark(selectedRange){
    var remarkIndex = -1;
    var remarkTitle = selectedRange.toString();
    showRemark(remarkTitle,function(remarks){
        console.log(remarkIndex);
        socket.emit("writeRemark",{reviewer:reviewer,index:remarkIndex,title:remarkTitle,remark:remarks});
        socket.emit("fetchRemarkCount",{index:remarkIndex});
        socket.once("newRemark",function(msg){
            remarkIndex = msg.index;
            highlight(msg.index,selectedRange);
        });
    });
}

function highlight(index,range) {
    var remarkSelectionsLen = remarkSelections.length;
    for(var i=0;i<remarkSelectionsLen;i++){
        if(remarkSelections[i]==range){
            console.log("R");
            return;
        }
    }
    remarkSelections.push(range);
    appendHighlight(range,index,function(event){
        showFloatingRemark($(this));
    });
    sendArticle($(".note-editable").html());
}

function saveArticle(index,content){
    clearTimeout(updateTimer);
    updateTimer = setTimeout(function(){
        socket.emit("saveArticle",{index:index,content:content.trim()});
        clearTimeout(updateTimer);
        updateTimer = null;
    },2000);
}