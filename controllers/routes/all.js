/**
 * Created by qs on 2016/1/22.
 */
var router = require("express").Router();
router.get("/", function(req,res){
    res.redirect("index");
});
router.post("/", function(req,res){

});

module.exports = router;