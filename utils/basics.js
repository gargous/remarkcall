/**
 * Created by qs on 2016/1/23.
 */

module.exports.getRandomString = function(length){
    var num = '';
    var alphabet = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for(var i = 0; i < length; i++){
        var randomNum = Math.floor(Math.random()*alphabet.length);
        num += alphabet.substr(randomNum,randomNum+1);
    }
    return num;
};