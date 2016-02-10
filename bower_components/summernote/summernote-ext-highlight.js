/*!
 * summernote highlight plugin
 * http://www.hyl.pw/
 *
 * Released under the MIT license
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
        // Browser globals: jQuery
        factory(window.jQuery);
    }
}(function ($) {
    // Extends plugins for adding highlight.
    //  - plugin is external module for customizing.
    $.extend($.summernote.plugins, {
        'highlight': function (context) {
            var self = this;
            var ui = $.summernote.ui;
            var $editor = context.layoutInfo.editor;
            var options = context.options;
            var lang = options.langInfo;
            context.memo('button.highlight', function () {
                // create button
                var button = ui.button({
                    contents: '<i class="fa fa-file-code-o"></i>',
                    tooltip: 'highlight',
                    click: function () {
                        self.show()
                    }
                });
                var $highlight = button.render();
                return $highlight;
            });

            this.createDialog = function () {

                var $box = $('<div />');
                var $selectGroup = $('<div class="form-group" />');
                var $select = $('<select class="form-control ext-highlight-select" />');
                //var $button = $('<div class="form-control ext-highlight-btn" />');

                var languages = ['nil',
                    'c', 'click', 'cpp', 'csharp', 'css', 'elixir', 'erlang', 'htm', 'html',
                    'java', 'javascript', 'glsl', 'go', 'processing', 'python', 'ruby',
                    'scala'
                ];

                for (var i = 0; i < languages.length; i++) {
                    $select.append('<option value="' + languages[i] + '">' + languages[i] + '</option>');
                }

                var $label = $('<label />');
                $label.html('Select language');
                $box.append($selectGroup.append($label));
                $box.append($selectGroup.append($select));

                return $box.html();
            };

            this.createCodeNode = function (code, select) {
                var $code = $("<code>");
                $code.html(code.trim());
                $code.addClass("language-" + select.trim());

                var $pre = $("<pre>");
                $pre.html($code);
                $pre.addClass('line-numbers').addClass("language-" + select.trim());

                if(select.trim()=="nil"){
                    return null;
                }
                return $pre[0];
            };

            this.codenode;

            this.showHighlightDialog = function (codeInfo) {
                return $.Deferred(function (deferred) {
                    var $extHighlightBtn = self.$dialog.find('.ext-highlight-btn');
                    var $extHighlightSelect = self.$dialog.find('.ext-highlight-select');
                    ui.onDialogShown(self.$dialog, function () {
                        context.triggerEvent('dialog.shown');
                        $extHighlightBtn.focus();
                        $extHighlightBtn[0].disabled = false;
                        $extHighlightBtn.one('click', function (event) {
                            event.preventDefault();
                            console.log("OK");
                            self.codenode = self.createCodeNode(codeInfo, $extHighlightSelect.val());
                            self.$dialog.modal('hide');
                        });
                    });

                    ui.onDialogHidden(self.$dialog, function () {
                        context.triggerEvent('dialog.shown');
                        deferred.resolve();
                    });
                    ui.showDialog(self.$dialog);
                }).promise();
            };

            this.getCodeInfo = function () {
                var text = context.invoke('editor.getSelectedText');
                return text;
            };

            this.show = function () {
                var codeInfo = self.getCodeInfo();
                this.showHighlightDialog(codeInfo).then(function (codeInfo) {
                    if(self.codenode==null){
                        context.invoke('editor.insertText',context.invoke('editor.getSelectedText'));
                    }else{
                        context.invoke('editor.insertNode',self.codenode);
                        context.invoke('editor.insertParagraph');
                    }
                });

                context.triggerEvent('dialog.shown');
            };

            //// This events will be attached when editor is initialized.
            //this.event = {
            //    // This will be called after modules are initialized.
            //    'summernote.init': function (we, e) {
            //        console.log('summernote initialized', we, e);
            //    },
            //    // This will be called when user releases a key on editable.
            //    'summernote.keyup': function (we, e) {
            //        console.log('summernote keyup', we, e);
            //    }
            //};
            //
            //// This method will be called when editor is initialized by $('..').summernote();
            //// You can create elements for plugin
            this.initialize = function () {
                var $container = options.dialogsInBody ? $(document.body) : $editor;

                var body = [
                    '<button href="#" class="btn btn-primary ext-highlight-btn disabled" disabled>',
                    'Insert code',
                    '</button>'
                ].join('');

                this.$dialog = ui.dialog({
                    className: 'ext-highlight',
                    title: 'Insert code',
                    body: this.createDialog(),
                    footer: body
                }).render().appendTo($container);
            };

            // This methods will be called when editor is destroyed by $('..').summernote('destroy');
            // You should remove elements on `initialize`.
            this.destroy = function () {
                ui.hideDialog(this.$dialog);
                this.$dialog.remove();
            };
        }
    });
}));
