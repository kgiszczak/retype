# Retype

Library to save and restore cursor position on contenteditable elements. You can use it to create functionality like Twitter's hashtags. It works by inserting special character in place of cursor, manipulating the text and then replacing this special character with cursor.

Demo and documentation is available at [https://kgiszczak.github.io/retype](https://kgiszczak.github.io/retype)

## Installation

jQuery is required for this plugin to work. In your HTML file, load simply by:
```html
<script src="retype.min.js"></script>
```
Both the minified and uncompressed (for development) versions are in the `/dist` directory.

## Usage

This plugin works on contenteditable element.

```html
<div id="editor" contenteditable="true"></div>
```

### Simple usage

Initialize it with string containing triggering characters. Everytime you type one of those characters it will be replaced with html tag.

```javascript
$('#editor').retype('#!');
```

For example this text:

```html
Lorem ipsum #dolor sit !amet.
```

will be replaced with this:

```html
Lorem ipsum <span class="tag tag1">#dolor</span> sit <span class="tag tag2">!amet</span>.
```

### Full control

If you want to have full control over what is replaced you can initialize this plugin with callback function. For example to wrap every occurance of
words `foo`, `bar` or `baz` with a span element you can use:

```javascript
$('#editor').retype(function() {
  var html = $(this).html();
  var c = $.retype.CARET_CHAR;

  html = html.replace(/<\/?span[^>]*>/ig, '');

  var foo = new RegExp('f' + c + '?o' + c + '?o', 'ig');
  html = html.replace(foo, '<span class="tag tag1">$&</span>');

  var bar = new RegExp('b' + c + '?a' + c + '?r', 'ig');
  html = html.replace(bar, '<span class="tag tag2">$&</span>');

  var baz = new RegExp('b' + c + '?a' + c + '?z', 'ig');
  html = html.replace(baz, '<span class="tag tag3">$&</span>');

  $(this).html(html);
});
```

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

Retype is released under the [MIT License](http://www.opensource.org/licenses/MIT).
