/**
 * Created by qs on 2016/1/28.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function ($) {

    $.extend($.summernote.plugins, {
        'round': function (context) {
            var self = this;
            var ui = $.summernote.ui;
            context.memo('button.round', function () {
                var button = ui.button({
                    contents: 'Remark',
                    tooltip: 'Remark',
                    click: function () {
                        self.show("#ffc520");
                    }
                });
                var $round = button.render();
                return $round;
            });

            this.show = function(color){
                gotTheSameRemark(function(got,selection){
                    if(got){
                        showFloatingRemark(selection);
                    }else{
                        showDialogRemark(selection);
                    }
                });
                context.triggerEvent('dialog.shown');
            };
        }
    });
}));