/**
 * Created by qs on 2016/1/27.
 */
var updateTimer = null;
var remarkSelections = [];
var differentOfArticle;
var oldArticleHTML;
var socket;
var articleInfo;
$(document).on("ready",function(){
    var articleInfoHTML = $("#articleInfo").html();
    articleInfo = JSON.parse(articleInfoHTML);
    init();
    handleSocket();
    handleEditor($("#summernote"));
    //editsFunc();
});

function init(){
    differentOfArticle = new diffDOM();
    oldArticleHTML = $("#summernote").html();
    socket = io.connect(getSocketAddress()+"/article"+articleInfo.index);
    if(!articleInfo.isAuthor){
        console.log(articleInfo.editable);
        initSummernote(articleInfo.editable);
    }else{
        initSummernote(true);
        //$("#editCheckbox")
    }
    initRemarks();
    //if(isAuthor)
    initNavContext();
}

function initRemarks (){
    $(".note-editable").find(".remark").on("click",function() {
        console.log("12323");
        showFloatingRemark($(this));
    });
    $(".note-editable").find(".remark").each(function(key,elem){
        socket.emit("fetchRemarkCount",{index:$(elem).attr("remark-index")});
    });
}

function initSummernote(editable){
    var popup;
    var editableStr;

    if(editable){
        popup = {
            air: [
                ['style', ['bold', 'italic', 'underline', 'clear','style']],
                ['font', ['strikethrough', 'superscript', 'subscript']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['insert', ['label','round']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['height', ['height']],
                ['highlight', ['highlight']],
                ["Insert",["picture","link","vedio","table"]]
            ]
        };
        editableStr = "enable";
    }else{
        popup = {
            air: [
                ['insert', ['round']]
            ]
        };
        editableStr = "disable";
    }
    $("#summernote").summernote('destroy');
    $("#summernote").summernote({
        dialogsFade: true,
        airMode: true,
        placeholder: 'write here...',
        popover: popup
    });
    $("#summernote").summernote("lineHeight", 1);
    $("#summernote").summernote(editableStr);
}

function handleSocket(){
    socket.on("getOnlineCount",function(msg){
        $("#online").text(msg.count);
    });
    socket.on("writeArticle",function(msg){
        differentOfArticle.apply($(".note-editable")[0], JSON.parse(msg));
        updateWordCount();
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
        var remarkTime = new Date().toTimeString();
        if(msg.remark!=""){
            modal.trigger("remark",[reviewer,title,remark,remarkTime]);
        }
    });
    socket.on("getRemarkCount",function(msg){
        $(".note-editable").find(".remark").each(function(key,elem){
            var $elem = $(elem);
            if($elem.attr("remark-index")==msg.index){
                $elem.attr("remark-count",msg.remarkCount);
                if(msg.remarkCount>1){
                    $elem.attr("title",msg.remarkCount+" remarks");
                }else{
                    $elem.attr("title",msg.remarkCount+" remark");
                }
                $elem.attr("data-toggle","tooltip");
                $elem.attr("data-placement","top");
                $elem.tooltip();
            }
        });
    });
    if(!articleInfo.isAuthor){
        socket.on("getEditInfo",function(msg){
            console.log("Edit",msg);
            if(msg.editable){
                initSummernote(true);
                $("#editLabel").text("允许编辑");
            }else{
                initSummernote(false);
                $("#editLabel").text("不可编辑");
            }
        });
    }else{
        $("#editCheckbox").on("click",function(event){
            var editable = this.checked;
            socket.emit("pushEditInfo",{editable:editable,title:$("h1")[0].innerHTML});
            if(editable){
                $("#editLabel").text("允许编辑");
            }else{
                $("#editLabel").text("不可编辑");
            }
        });
    }
    socket.on("getOnlineList",function(msg){
        onGetOnlineList(msg);
    });
    socket.emit("pushUser",{username:articleInfo.visitor});
}

function updateWordCount(contents){
    $("#word-count").text($($(".note-editable")[0]).text().length+"字");
}

function sendArticle(contents){
    if(contents!=oldArticleHTML){
        var different = getHtmlDiff(contents,oldArticleHTML,differentOfArticle);
        console.log(different);
        socket.emit("writeArticle",JSON.stringify(different));
        oldArticleHTML = contents;
    }
    saveArticle(articleInfo.index,contents);
}

function handleEditor(editor){
    updateWordCount();
    editor.on('summernote.enter', function(ew, event, $editable) {
        if(selectionInSpan("pre")){
            console.log("!!!!!");
            event.preventDefault();
            editor.summernote('insertNode', $("<br />")[0]);
            var selection = window.getSelection();
            var nowNode = window.getSelection().focusNode;
            var nowParent = nowNode.parentNode;
            var nextIndex = 0;
            for(var i=0;i<nowParent.childNodes.length;i++){
                if(nowParent.childNodes[i]==nowNode){
                    nextIndex = i+2;
                    break;
                }
            }
            selection.collapse(nowParent,nextIndex);
        }
    });
    editor.on("summernote.change", function(event, contents, $editable) {
        updateWordCount(contents);
        sendArticle(contents);
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
        socket.emit("writeRemark",{reviewer:articleInfo.visitor,index:remarkIndex,title:remarkTitle,remark:remarks});
        socket.emit("fetchRemarkCount",{index:remarkIndex});
    });
    socket.emit("fetchRemarks",{index:remarkIndex});
}

function showDialogRemark(selectedRange){
    if(!selectionInSpan("pre")){
        var remarkIndex = -1;
        var remarkTitle = selectedRange.toString();
        showRemark(remarkTitle,function(remarks){
            console.log(remarkIndex);
            socket.emit("writeRemark",{reviewer:articleInfo.visitor,index:remarkIndex,title:remarkTitle,remark:remarks});
            socket.emit("fetchRemarkCount",{index:remarkIndex});
            socket.once("newRemark",function(msg){
                remarkIndex = msg.index;
                highlight(msg.index,selectedRange);
            });
        });
    }
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

//当前光标是否在某个标签内
function selectionInSpan(span){
    var preNodes = $(span).children();
    var inCodeSpan = false;
    for(var i=0;i<preNodes.length;i++){
        if(window.getSelection().containsNode(preNodes[i],true)){
            inCodeSpan = true;
        }
    }
    return inCodeSpan;
}

function getSocket(){
    return socket;
}