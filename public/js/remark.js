/**
 * Created by qs on 2016/2/8.
 */

function appendHighlight(selectedRange,index,clickEvent){
    var selectedText = selectedRange.extractContents();
    var span = document.createElement("span");
    span.className = "remark";
    span.appendChild(selectedText);
    span.setAttribute("title","remark");
    span.setAttribute("remark-index",index);
    span.setAttribute("remark-count",1);
    span.onclick = clickEvent;
    /*
     span.setAttribute("data-toggle","popover");
     span.setAttribute("data-placement","bottom");
    span.setAttribute("data-template",
        "<div class='popover' role='tooltip'>" +
        " <div class='arrow'> " +
        "</div> " +
        "<h3 class='popover-title'>" +
        "Popover title </h3>" +
        " <div class='popover-content'>" +
        " </div> " +
        "<div id='remark-summernote'> </div>" +
        "<a href='#' id='remarkSubmit class='btn btn-success'>Remark!</a>" +
        "</div>");
    span.setAttribute("data-html",true);


    $(span).on('hidden.bs.popover', function () {
        var popover = $(this);
        popover.off("remark");
        popover.attr("content","");
        popover.off("hidden.bs.popover");
        popover.off("shown.bs.popover");
        popover.find("#remarkSubmit").off("click");
    });
    $(span).on('shown.bs.popover', function () {
        var popover = $(this);
        var articleInfo = "";
        popover.on("remark",function(event,reviewer,title,remark){
            articleInfo = "";
            console.log("remark",remark);
            if(title==remarkTitle){
                var content = popover.attr("content")+appendRemark(reviewer,remark);
                popover.attr("content",content);
            }
        });
        popover.attr("title","Remark:" + remarkTitle);
        popover.find("#remark-summernote").summernote({
            toolbar: [
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['font', ['strikethrough', 'superscript', 'subscript']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ["Insert",["link"]]
            ]
        });
        popover.find(".note-editable").html("");
        popover.find("#remark-summernote").on("summernote.change",function(event, contents, $editable){
            articleInfo = contents;
        });
        popover.find("#remarkSubmit").on("click",function(event){
            callback(articleInfo);
        });
    });
    */
    selectedRange.insertNode(span);
}

function appendRemark(reviewer,remark){
    var remarkItem = document.createElement("li");
    var reviewerSpan = document.createElement("div");
    var remarkSpan = document.createElement("div");
    reviewerSpan.className = "remarkReviewer";
    reviewerSpan.innerHTML = "<b>"+reviewer+"</b>";
    remarkSpan.className = "remarkContent";
    remarkSpan.innerHTML = remark;
    remarkItem.className = "remarkItem list-group-item";
    remarkItem.appendChild(reviewerSpan);
    remarkItem.appendChild(remarkSpan);
    return remarkItem;
}

function showRemark(remarkTitle,callback){
    var modalDialog = $("#remarkFloat");
    var oldRemarkTime = "";
    modalDialog.on("hidden.bs.modal",function(e){
        var modal = $(this);
        modal.off("remark");
        modal.find(".modal-body").html("");
        console.log("hide");
        modal.off("hidden.bs.modal");
        modal.off("show.bs.modal");
        modal.find("#remarkSubmit").off("click");
        modal.find("#remarkNote").off("summernote.change");
    });
    modalDialog.on("show.bs.modal", function (event) {
        var modal = $(this);
        var remarks = "";
        var oldRemarks = "";
        modal.on("remark",function(event,reviewer,title,remark,remarkTime){
            console.log("remarkTime",remarkTime);
            if(remarkTime!=oldRemarkTime){
                remarks = "";
                oldRemarks = "";
                console.log("remark",remark);
                if(title==remarkTitle){
                    modal.find(".modal-body").append(appendRemark(reviewer,remark));
                }
            }
        });
        modal.find(".modal-header").find("h3").text("Remark:" + remarkTitle);
        var popup = [
            ['style', ['fontsize','bold','color', 'italic', 'underline', 'clear']],
            ['font', ['strikethrough', 'superscript', 'subscript']]
        ];
        modal.find("#remarkNote").summernote({
            dialogsFade: true,
            airMode:true,
            placeholder: 'write here...',
            popover:{
                air:popup
            }
        });
        modal.find(".note-editable").html("");
        modal.find("#remarkNote").on("summernote.change",function(event, contents, $editable){
            remarks = contents;
        });
        modal.find("#remarkSubmit").on("click",function(event){
            if(remarks != oldRemarks){
                callback(remarks);
                oldRemarks = remarks;
            }
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