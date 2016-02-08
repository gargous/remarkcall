/**
 * Created by qs on 2016/2/8.
 */

function appendHighlight(selectedRange,index,clickEvent){
    var selectedText = selectedRange.extractContents();
    var span = document.createElement("span");
    span.className = "remark";
    span.appendChild(selectedText);
    span.setAttribute("data-toggle","tooltip");
    span.setAttribute("data-placement","top");
    span.setAttribute("title","remark");
    span.setAttribute("remark-index",index);
    span.setAttribute("remark-count",1);
    span.onclick = clickEvent;
    selectedRange.insertNode(span);
}

function appendRemark(reviewer,remark){
    var remarkItem = document.createElement("li");
    var reviewerSpan = document.createElement("div");
    var remarkSpan = document.createElement("div");
    reviewerSpan.className = "remarkReviewer";
    reviewerSpan.innerHTML = reviewer;
    remarkSpan.className = "remarkContent";
    remarkSpan.innerHTML = remark;
    remarkItem.className = "remarkItem list-group-item";
    remarkItem.appendChild(reviewerSpan);
    remarkItem.appendChild(remarkSpan);
    return remarkItem;
}

function showRemark(remarkTitle,callback){
    var modalDialog = $("#remarkFloat");
    modalDialog.on("hidden.bs.modal",function(e){
        var modal = $(this);
        modal.off("remark");
        modal.find(".modal-body").html("");
        console.log("hide");
        modal.off("hidden.bs.modal");
        modal.off("show.bs.modal");
        modal.find("#remarkSubmit").off("click");
    });
    modalDialog.on("show.bs.modal", function (event) {
        var modal = $(this);
        var remarks = "";
        modal.on("remark",function(event,reviewer,title,remark){
            remarks = "";
            console.log("remark",remark);
            if(title==remarkTitle){
                modal.find(".modal-body").append(appendRemark(reviewer,remark));
            }
        });
        modal.find(".modal-header").find("h3").text("Remark:" + remarkTitle);
        modal.find("#remarkNote").summernote({
            toolbar: [
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['font', ['strikethrough', 'superscript', 'subscript']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ["Insert",["link"]]
            ]
        });
        modal.find(".note-editable").html("");
        modal.find("#remarkNote").on("summernote.change",function(event, contents, $editable){
            remarks = contents;
        });
        modal.find("#remarkSubmit").on("click",function(event){
            callback(remarks);
        });
    });
    modalDialog.modal('show');
}

function getSelectionRange(window,callback){
    var selection = window.getSelection();
    if(selection.anchorOffset == selection.focusOffset && selection.anchorNode.nodeValue == selection.focusNode.nodeValue){
    }else{
        callback(selection.getRangeAt(0));
    }
}

function gotTheSameRemark(callback){
    getSelectionRange(window,function(range){
        var hasTheSameNode = false;
        var selections = window.getSelection();
        $(".remark").each(function(key,elem){
            if(selections.containsNode(elem,true)){
                if(elem.innerText.trim()==range.toString().trim() && !hasTheSameNode){
                    hasTheSameNode = true;
                    callback(true,$(elem));
                }
            }
        });
        if(!hasTheSameNode){
            callback(false,range);
        }
    });
}