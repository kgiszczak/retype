(function() {
  'use strict';

  var CARET_CHAR = '\u2603';
  var CARET_REGEXP = new RegExp(CARET_CHAR, 'ig');

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
    container.innerHTML = container.innerHTML; // mutate the dom

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
        node.textContent = node.textContent.replace(CARET_REGEXP, '');
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

  // HISTORY CLASS DEFINITION
  // ========================

  var History = function(content) {
    this.entries = [content || ''];
    this.position = 0;
  };

  History.prototype.push = function(content) {
    this.entries.length = this.position + 1;
    if (this.entries[this.position].replace(CARET_REGEXP, '') === content.replace(CARET_REGEXP, ''))
      return;
    this.entries.push(content);
    this.position += 1;
  };

  History.prototype.prev = function() {
    if (this.position > 0) this.position -= 1;
    return this.entries[this.position];
  };

  History.prototype.next = function() {
    if (this.position < this.entries.length - 1) this.position += 1;
    return this.entries[this.position];
  };

  History.prototype.isLast = function() {
    return this.entries.length === this.position + 1;
  };

  // RETYPE CLASS DEFINITION
  // =======================

  var Retype = function(element, trigger) {
    this.$element = $(element);
    this.setTrigger(trigger);

    this.history = new History(this.$element.html());
    this.prevText = this.$element.html();
    this.action = 'none';

    normalize.call(this);

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

  function normalize() {
    var html = this.$element.html();

    // fix strange behavior under FF when input is empty
    if (html === '') html = '<br>';

    this.$element.html(html);
  }

  function keydown(e) {
    var that = this,
        prevAction = this.action;

    if (e.which === 90 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
    }

    setTimeout(function() {
      retype(that.$element[0], function() {
        normalize.call(that);

        var currentText = that.$element.html().replace(CARET_REGEXP, '');
        var prevTextClear = that.prevText.replace(CARET_REGEXP, '');

        if (e.which === 90 && (e.metaKey || e.ctrlKey)) {
          if (e.shiftKey) {
            if (that.history.isLast()) that.history.push(that.prevText);
            that.$element.html(that.history.next());
          } else {
            if (that.history.isLast()) that.history.push(that.prevText);
            that.$element.html(that.history.prev());
            that.action = 'back';
          }
        } else {
          switch (e.which) {
            case 8:
              that.action = 'del';
              break;
            case 86:
              if (e.metaKey || e.ctrlKey) that.action = 'paste' + new Date().getTime();
              break;
            case 37:
            case 38:
            case 39:
            case 40:
              that.action = 'arrow';
              break;
            default:
              if (prevTextClear !== currentText) that.action = 'none';
          }

          if (prevTextClear !== currentText && prevAction !== that.action) {
            that.history.push(that.prevText);
          }
        }

        that.callback();
        that.prevText = that.$element.html();
      });
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
