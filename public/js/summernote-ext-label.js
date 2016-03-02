/**
 * Created by qs on 2016/2/29.
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
        'label': function (context) {
            var self = this;
            var ui = $.summernote.ui;
            context.memo('button.label', function () {
                var button = ui.button({
                    contents: 'Label',
                    tooltip: 'Label',
                    click: function () {
                        self.show();
                    }
                });
                var $round = button.render();
                return $round;
            });

            this.show = function(){
                var node = document.createElement("label");
                node.className = "label label-info";
                node.innerHTML = context.invoke("editor.createRange").toString();
                context.invoke("editor.insertNode", node);
                context.invoke("editor.insertText", " _ ");
            };
        }
    });
}));