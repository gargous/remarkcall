/**
 * Created by qs on 2016/1/22.
 */
var express = require('express');
var router = express.Router();
router.get("/", function(req,res){
    res.redirect("index");
});
router.post("/", function(req,res){

});

module.exports = router;