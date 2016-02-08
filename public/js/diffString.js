/**
 * Created by qs on 2016/1/28.
 */

function getStrSubLimited(s,index,length){
    var sub = "";
    if(index>=s.length){
        sub = "==";
    }else if(index<0){
        sub = "==";
    }else{
        sub = s.substr(index,length);
    }
    return sub;
}

function getStrDiff(s1,s2,callback){
    var lenMax = s1.length>s2.length?s1.length:s2.length;
    var head = -1;
    var tail = -1;

    if(s1==s2){
        callback("");
        return;
    }
    for(var i=0;i<lenMax;i++){
        var head1 = getStrSubLimited(s1,i,1);
        var head2 = getStrSubLimited(s2,i,1);
        if(head1!=head2){
            head = i;
            break;
        }
        head = i;
    }
    for(var i=0;i<lenMax;i++){
        var tail1 = getStrSubLimited(s1,s1.length-i-1,1);
        var tail2 = getStrSubLimited(s2,s2.length-i-1,1);
        if(tail1!=tail2){
            tail = i-1;
            break;
        }
        tail = i-1;
    }

    callback("",head,tail);
}

function getHtmlDiff(newContent,oldContent,differ){
    var newElem = document.createElement('div');
    var oldElem = document.createElement('div');
    newElem.innerHTML = newContent;
    oldElem.innerHTML = oldContent;
    return differ.diff(oldElem,newElem);
}