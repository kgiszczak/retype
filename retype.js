(function() {
  'use strict';

  var CARET_CHAR = '\u2603';

  function findCaretNode(container) {
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, null);

    var node, caretNode;
    while((node = walker.nextNode())) {
      if (node.nodeType === 3 && node.textContent.indexOf(CARET_CHAR) !== -1) {
        caretNode = node;
        break;
      }
    }

    return caretNode;
  }

  function retype(container, callback) {
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);

    if (!range.collapsed) return;

    var caret = document.createTextNode(CARET_CHAR);
    range.insertNode(caret);

    callback();

    var node = findCaretNode(container);

    if (node) {
      var pos = document.createRange();

      // fix for firefox which incorectly renders caret
      if (container.childNodes.length === 1 &&
          container.textContent === CARET_CHAR &&
          container.childNodes[0] === node) {
        node.parentNode.removeChild(node);
        pos.setStart(container, 0);
      } else {
        var index = node.textContent.indexOf(CARET_CHAR);
        node.textContent = node.textContent.replace(new RegExp(CARET_CHAR, 'ig'), '');
        pos.setStart(node, index);
      }

      selection.removeAllRanges();
      selection.addRange(pos);
    }
  }

  function defaultCallback() {
    var html = this.$element.html();

    html = html.replace(/<span class="tag tag\d+">/ig, '')
               .replace(/<\/span>/ig, '');

    var i, exp;
    for (i = 0; i < this.trigger.length; i++) {
      exp = new RegExp('\\' + this.trigger[i] + '\\S{2,}', 'ig');
      html = html.replace(exp, '<span class="tag tag' + (i + 1) + '">$&</span>');
    }

    this.$element.html(html);
  }

  // RETYPE CLASS DEFINITION
  // =======================

  var Retype = function(element, trigger) {
    this.$element = $(element);
    this.setTrigger(trigger);

    this.$element.on('keydown', $.proxy(keydown, this));
  };

  Retype.prototype.setTrigger = function(trigger) {
    if (typeof trigger === 'function') {
      this.callback = $.proxy(trigger, this.$element[0]);
    } else {
      this.callback = $.proxy(defaultCallback, this);
      if (trigger) this.trigger = $.isArray(trigger) ? trigger : trigger.split('');
    }
  };

  function keydown(e) {
    var that = this;

    setTimeout(function() {
      retype(that.$element[0], that.callback);
    }, 0);
  }

  // RETYPE PLUGIN DEFINITION
  // ========================

  $.fn.retype = function(option) {
    return this.each(function() {
      var $this = $(this),
          data = $this.data('retype.instance');

      if (!data) {
        $this.data('retype.instance', (data = new Retype(this, option)));
      } else {
        data.setTrigger(option);
      }
    });
  };

})(jQuery);
