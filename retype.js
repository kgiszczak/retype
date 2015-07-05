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
    if (selection.rangeCount === 0) return;

    var range = selection.getRangeAt(0);
    if (!range.collapsed) return;

    if (document.activeElement !== container) return;

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

  function findTags(trigger, html, triggers) {
    var i, e, start = null, ary = [];
    var regexp = new RegExp('\\s|<|\\' + triggers.join('|\\'));

    for (i = 0; i < html.length; i++) {
      e = html[i];

      if (start !== null && e.match(regexp)) {
        ary.push({start: start, stop: i});
        start = null;
      }

      if (start === null && e === trigger) start = i;
    }

    if (start !== null) ary.push({start: start, stop: html.length});

    var entries = [];

    for (i = 0; i < ary.length; i++) {
      e = ary[i];

      if (html[e.stop - 1] === CARET_CHAR) e.stop -= 1;
      if (e.start + 1 !== e.stop) entries.push(e);
    }

    return entries;
  }


  function defaultCallback() {
    var html = this.$element.html();

    html = html.replace(/<\/?span[^>]*>/ig, '');

    var i, j, e, tags;
    for (i = 0; i < this.trigger.length; i++) {
      tags = findTags(this.trigger[i], html, this.trigger);

      for (j = tags.length - 1; j >= 0; j--) {
        e = tags[j];
        html = html.substring(0, e.start) +
          '<span class="tag tag' + (i + 1) + '">' +
          html.substring(e.start, e.stop) +
          '</span>' + html.substring(e.stop);
      }
    }

    this.$element.html(html);
  }

  // HISTORY CLASS DEFINITION
  // ========================

  var History = function(content) {
    this.entries = [content || ''];
    this.reverts = [];
    this.position = 0;
    this.revertsPos = -1;
  };

  History.prototype.update = function(content) {
    if (this.position !== 0) return;
    if (sanitize(this.entries[0]) !== sanitize(content)) return;
    this.entries[0] = content;
  };

  History.prototype.push = function(content) {
    if (sanitize(content) === sanitize(this.entries[this.position])) return;
    this.entries.push(content);
    this.position += 1;
  };

  History.prototype.prev = function() {
    var val = this.entries[this.position];
    if (this.position > 0) this.position -= 1;
    this.entries.length = this.position + 1;
    return val;
  };

  History.prototype.keep = function(content) {
    if (sanitize(content) === sanitize(this.entries[0])) return;
    if (sanitize(content) === sanitize(this.entries[this.position])) return;
    this.reverts.push(content);
    this.revertsPos += 1;
  };

  History.prototype.revert = function() {
    var val = this.reverts[this.revertsPos];
    if (this.revertsPos > -1) this.revertsPos -= 1;
    this.reverts.length = this.revertsPos + 1;
    return val;
  };

  History.prototype.clearReverts = function() {
    this.reverts.length = 0;
    this.revertsPos = -1;
  };

  function sanitize(txt) {
    return txt.replace(CARET_CHAR, '');
  }

  // RETYPE CLASS DEFINITION
  // =======================

  var Retype = function(element, trigger) {
    this.$element = $(element);
    this.setTrigger(trigger);

    normalize.call(this);
    this.callback();

    this.history = new History(CARET_CHAR + this.$element.html());
    this.action = 'none';

    this.$element
      .on('keydown', $.proxy(keydown, this))
      .on('focus', $.proxy(focus, this))
      .on('click', $.proxy(click, this));
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
    if (html === '') this.$element.html('<br>');
  }

  function keydown(e) {
    var that = this,
        prevAction = this.action,
        prevTextRetyped;

    if (e.which === 90 && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
    }

    if (e.which === 9) return; // do nothing on tab key

    var prevText = this.$element.html();

    retype(that.$element[0], function() {
      prevTextRetyped = that.$element.html();
    });

    setTimeout(function() {
      var currentText = that.$element.html();
      prevTextRetyped = prevTextRetyped || prevText;

      retype(that.$element[0], function() {
        if (e.which === 90 && (e.metaKey || e.ctrlKey)) {
          if (e.shiftKey) {
            if (that.history.revertsPos > -1) that.history.push(prevTextRetyped);
            that.$element.html(that.history.revert());
          } else {
            that.$element.html(that.history.prev());
            that.history.keep(prevTextRetyped);
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
              if (prevText !== currentText) that.action = 'none';
          }

          if (prevText !== currentText && prevAction !== that.action) {
            that.history.push(prevTextRetyped);
            that.history.clearReverts();
          }

          if (that.action === 'arrow') {
            that.history.update(that.$element.html());
          }
        }

        that.callback();
      });

      normalize.call(that);
    }, 0);
  }

  function focus() {
    this.history.update(CARET_CHAR + this.$element.html());
  }

  function click() {
    var that = this;

    retype(this.$element[0], function() {
      that.history.update(that.$element.html());
    });
  }

  // RETYPE PLUGIN DEFINITION
  // ========================

  $.retype = retype;
  $.retype.CARET_CHAR = CARET_CHAR;

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
