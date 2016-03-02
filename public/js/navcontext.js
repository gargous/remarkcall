/**
 * Created by qs on 2016/2/29.
 */
function initNavContext(){
    var contextBar = $($("#navbar-context").children()[0]);
    console.log(contextBar);
    var length = 0;
    var h3s = $(".note-editable").find("h3");
    h3s.each(function(key,elem){
        var itemText = $(elem).text();
        var itemTextArray = itemText.split(".");
        itemTextArray.shift();
        itemText = itemTextArray.toString().trim();
        if(itemText!=""){
            var timestamp = Date.parse(new Date())/1000;
            var itemHref = "context"+key+"at"+timestamp;
            if(elem.id==itemHref){

            }
            elem.id = itemHref;
            itemHref = "#"+itemHref;
            contextBar.append($("<li role='presentation'><a href="+itemHref+">"+itemText+"</a></li>"));
        }
        length = key;
        if(length>=h3s.toArray().length-1){
            contextBar.append($("<li role='presentation'><a href='#bottom'>Bottom</a></li>"));
        }
    });


}