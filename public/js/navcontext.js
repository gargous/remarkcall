/**
 * Created by qs on 2016/2/29.
 */
function initNavContext(){
    var contextBar = $($("#navbar-context").children()[0]);
    var lastItem = $(contextBar.children()[contextBar.children().length-1]);
    var h3s = $(".note-editable").find("h3");
    h3s.each(function(key,elem){
        var itemText = $(elem).text();
        var itemTextArray = itemText.split(".");
        if(itemTextArray.length>1){
            itemTextArray.shift();
        }
        itemText = itemTextArray.toString().trim();
        console.log(itemText);
        if(itemText!=""){
            var date  = new Date();
            var timestamp = Date.parse(date)/1000;
            var itemHref = "context"+key+"at"+timestamp;
            elem.id = itemHref;
            itemHref = "#"+itemHref;
            lastItem.before($("<li role='presentation'><a href="+itemHref+">"+itemText+"</a></li>"));
        }
    });


}