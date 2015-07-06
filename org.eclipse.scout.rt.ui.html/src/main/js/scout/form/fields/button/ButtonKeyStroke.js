scout.ButtonKeyStroke = function(button, keyStroke) {
  scout.ButtonKeyStroke.parent.call(this);
  this.drawHint = true;
  this.keyStroke = keyStroke;
  this._button = button;
  this.initKeyStrokeParts();
  this.bubbleUp = false;
};
scout.inherits(scout.ButtonKeyStroke, scout.KeyStroke);
/**
 * @Override scout.KeyStroke
 */
scout.ButtonKeyStroke.prototype.handle = function(event) {
  var actionPerformed = this._button.doAction();
  if (actionPerformed && this.preventDefaultOnEvent) {
    event.preventDefault();
  }
};

/**
 * @Override scout.Action
 */
scout.ButtonKeyStroke.prototype.accept = function(event) {
  if (!jQuery.contains(document.documentElement, this._button.$field[0])) {
    return false;
  }
  return scout.ButtonKeyStroke.parent.prototype.accept.call(this, event);
};

scout.ButtonKeyStroke.prototype._drawKeyBox = function($container) {
  if (this._button.$container && this._button.enabled && this._button.visible) {
    var keyBoxText = scout.codesToKeys[this.keyStrokeKeyPart];
    scout.keyStrokeBox.drawSingleKeyBoxItem(16, keyBoxText, this._button.$container, this.ctrl, this.alt, this.shift, true);
  }
};

/**
 * @override Menu.js
 */
scout.Button.prototype._drawKeyBox = function($container) {
  if (this.$container) {
    var keyBoxText = scout.codesToKeys[this.keyStrokeKeyPart];
    scout.keyStrokeBox.drawSingleKeyBoxItem(2, keyBoxText, this._field.$container, this.ctrl, this.alt, this.shift);
  }
};
