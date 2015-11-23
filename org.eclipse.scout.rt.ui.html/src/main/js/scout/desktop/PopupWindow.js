scout.PopupWindow = function(myWindow, form) { // use 'myWindow' in place of 'window' to prevent confusion with global window variable
  this.myWindow = myWindow;
  this.form = form;
  this.session = form.session;
  this.events = new scout.EventSupport();
  this.$container;
  this.htmlComp;

  // link Form instance with this popupWindow instance
  // this is required when form (and popup-window) is closed by the model
  form.popupWindow = this;

  // link Window instance with this popupWindow instance
  // this is required when we want to check if a certain DOM element belongs
  // to a popup window
  myWindow.popupWindow = this;
  myWindow.name = 'Scout popup-window ' + form.modelClass;
};

scout.PopupWindow.prototype._onUnload = function() {
  $.log.debug('stored form ID ' + this.form.id + ' to session storage');
  if (this.form.destroyed) {
    $.log.debug('form ID ' + this.form.id + ' is already destroyed - don\'t trigger unload event');
  } else {
    this.events.trigger('popupWindowUnload', this);
  }
};

scout.PopupWindow.prototype._onReady = function() {
  // set container (used as document-root from callers)
  var myDocument = this.myWindow.document,
    $myWindow = $(this.myWindow),
    $myDocument = $(myDocument);

  // Install polyfills on new window
  scout.polyfills.install(this.myWindow);

  this.$container = $('.scout', myDocument);
  this.htmlComp = new scout.HtmlComponent(this.$container, this.session);
  this.htmlComp.setLayout(new scout.SingleLayout());
  this.$container.height($myWindow.height());
  this.form.render(this.$container);

  // resize browser-window before layout?
  if (this.resizeToPrefSize) {
    var prefSize = this.htmlComp.getPreferredSize(),
    // we cannot simply set the pref. size of the component as window size,
    // since the window "chrome" (window-border, -title and location bar)
    // occupies some space. That's why we measure the difference between
    // the current document size and the window size first.
      myWindowSize = new scout.Dimension(this.myWindow.outerWidth, this.myWindow.outerHeight),
      myDocumentSize = new scout.Dimension($myDocument.width(), $myDocument.height()),
      windowChromeHoriz = myWindowSize.width - myDocumentSize.width,
      windowChromeVert = myWindowSize.height - myDocumentSize.height;

    this.myWindow.resizeTo(prefSize.width + windowChromeHoriz, prefSize.height + windowChromeVert);
    this.resizeToPrefSize = false;
  }
  this.form.htmlComp.validateLayout();

  // Must register some top-level keystroke- and mouse-handlers on popup-window
  // We do the same thing here, as with the $entryPoint of the main window
  this.session.keyStrokeManager.installTopLevelKeyStrokeHandlers(this.$container);
  this.session.focusManager.installTopLevelMouseHandlers(this.$container);
  scout._installGlobalMouseDownInterceptor(myDocument);

  // Attach event handlers on window
  $(this.myWindow)
    .on('unload', this._onUnload.bind(this))
    .on('resize', this._onResize.bind(this));

  // Delegate uncaught JavaScript errors in the popup-window to the main-window
  this.myWindow.onerror = this.myWindow.opener.onerror;
};

// Note: currently _onResize is only called when the window is resized, but not when the position of the window changes.
// if we need to do that in a later release we should take a look on the SO-post below:
// http://stackoverflow.com/questions/4319487/detecting-if-the-browser-window-is-moved-with-javascript
scout.PopupWindow.prototype._onResize = function() {
  var $myWindow = $(this.myWindow),
    width = $myWindow.width(),
    height = $myWindow.height(),
    left = this.myWindow.screenX,
    top = this.myWindow.screenY;
  $.log.debug('popup-window resize: width=' + width + ' height=' + height + ' top=' + top + ' left=' + left);

  // store window bounds by class ID
  scout.PopupWindow.storeWindowBounds(this.form, new scout.Rectangle(left, top, width, height));

  var windowSize = new scout.Dimension($myWindow.width(), $myWindow.height());
  this.htmlComp.setSize(windowSize);
};

scout.PopupWindow.storeWindowBounds = function(form, bounds) {
  var storageKey = 'formBounds-' + form.classId;
  window.localStorage[storageKey] = JSON.stringify(bounds);
};

scout.PopupWindow.readWindowBounds = function(form) {
  var storageKey = 'formBounds-' + form.classId,
    bounds = window.localStorage[storageKey];
  if (!bounds) {
    return null;
  }
  bounds = JSON.parse(bounds);
  return new scout.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
};

scout.PopupWindow.prototype.isClosed = function() {
  return this.myWindow.closed;
};

scout.PopupWindow.prototype.close = function() {
  this.myWindow.close();
};

scout.PopupWindow.prototype.title = function(title) {
  this.myWindow.document.title = title;
};

