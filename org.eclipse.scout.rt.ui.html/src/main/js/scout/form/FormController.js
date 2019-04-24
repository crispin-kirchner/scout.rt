/*******************************************************************************
 * Copyright (c) 2014-2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
/**
 * Controller with functionality to register and render views and dialogs.
 *
 * The forms are put into the list 'views' and 'dialogs' contained in 'displayParent'.
 */
scout.FormController = function(model) {
  this.displayParent = model.displayParent;
  this.session = model.session;
};

/**
 * Adds the given view or dialog to this controller and renders it.
 * position is only used if form is a view. this position determines at which position the tab is placed.
 * if select view is set the view rendered in _renderView is also selected.
 */
scout.FormController.prototype.registerAndRender = function(form, position, selectView) {
  scout.assertProperty(form, 'displayParent');
  if (form.isPopupWindow()) {
    this._renderPopupWindow(form);
  } else if (form.isView()) {
    this._renderView(form, true, position, selectView);
  } else {
    this._renderDialog(form, true);
  }
};

scout.FormController.prototype._renderPopupWindow = function(formAdapterId, position) {
  throw new Error('popup window only supported by DesktopFormController');
};

/**
 * Removes the given view or dialog from this controller and DOM. However, the form's adapter is not destroyed. That only happens once the Form is closed.
 */
scout.FormController.prototype.unregisterAndRemove = function(form) {
  if (!form) {
    return;
  }

  if (form.isPopupWindow()) {
    this._removePopupWindow(form);
  } else if (form.isView()) {
    this._removeView(form);
  } else {
    this._removeDialog(form);
  }
};

scout.FormController.prototype._removePopupWindow = function(form) {
  throw new Error('popup window only supported by DesktopFormController');
};

/**
 * Renders all dialogs and views registered with this controller.
 */
scout.FormController.prototype.render = function() {
  this._renderViews();

  this._renderDialogs();
};

scout.FormController.prototype._renderViews = function() {
  this.displayParent.views.forEach(function(view, position) {
    view._setProperty('displayParent', this.displayParent);
    this._renderView(view, false, position, false);
  }.bind(this));
};

scout.FormController.prototype._renderDialogs = function() {
  this.displayParent.dialogs.forEach(function(dialog) {
    dialog._setProperty('displayParent', this.displayParent);
    this._renderDialog(dialog, false);
  }.bind(this));
};
/**
 * Removes all dialogs and views registered with this controller.
 */
scout.FormController.prototype.remove = function() {
  this.displayParent.dialogs.forEach(function(dialog) {
    this._removeDialog(dialog, false);
  }.bind(this));
  this.displayParent.views.forEach(function(view, position) {
    this._removeView(view, false);
  }.bind(this));
};

/**
 * Activates the given view or dialog.
 */
scout.FormController.prototype.activateForm = function(form) {
  // TODO [7.0] awe: (2nd screen) handle popupWindow?
  var displayParent = this.displayParent;
  while (displayParent) {
    if (displayParent instanceof scout.Outline) {
      this.session.desktop.setOutline(displayParent);
      break;
    }
    displayParent = displayParent.displayParent;
  }

  if (form.displayHint === scout.Form.DisplayHint.VIEW) {
    this._activateView(form);
  } else {
    this._activateDialog(form);
  }
};

scout.FormController.prototype.acceptView = function(view, register, position, selectView) {
  // Only render view if 'displayParent' is rendered yet; if not, the view will be rendered once 'displayParent' is rendered.
  if (!this.displayParent.rendered) {
    return false;
  }
  return true;
};

scout.FormController.prototype._renderView = function(view, register, position, selectView) {
  if (register) {
    if (position !== undefined) {
      scout.arrays.insert(this.displayParent.views, view, position);
    } else {
      this.displayParent.views.push(view);
    }
  }

  // Display parent may implement acceptView, if not implemented -> use default
  if (this.displayParent.acceptView) {
    if (!this.displayParent.acceptView(view)) {
      return;
    }
  } else if (!this.acceptView(view)) {
    return;
  }

  // Prevent "Already rendered" errors --> TODO [7.0] BSH: Remove this hack! Fix in on model if possible. See #162954.
  if (view.rendered) {
    return false;
  }
  if (this.session.desktop.displayStyle === scout.Desktop.DisplayStyle.COMPACT && !this.session.desktop.bench) {
    // Show bench and hide navigation if this is the first view to be shown
    this.session.desktop.sendOutlineToBack();
    this.session.desktop.switchToBench();
  } else if (this.session.desktop.bench.removalPending) {
    // If a new form should be shown while the bench is being removed because the last form was closed, schedule the rendering to make sure the bench and the new form will be opened right after the bench has been removed
    setTimeout(this._renderView.bind(this, view, register, position, selectView));
    return;
  }
  this.session.desktop.bench.addView(view, selectView);
};

scout.FormController.prototype.acceptDialog = function(dialog) {
  // Only render dialog if 'displayParent' is rendered yet; if not, the dialog will be rendered once 'displayParent' is rendered.
  if (!this.displayParent.rendered) {
    return false;
  }
  return true;
};

scout.FormController.prototype._renderDialog = function(dialog, register) {
  var desktop = this.session.desktop;
  if (register) {
    this.displayParent.dialogs.push(dialog);
  }

  // Display parent may implement acceptDialog, if not implemented -> use default
  if (this.displayParent.acceptDialog) {
    if (!this.displayParent.acceptDialog(dialog)) {
      return;
    }
  } else if (!this.acceptDialog(dialog)) {
    return;
  }

  // Prevent "Already rendered" errors --> TODO [7.0] BSH: Remove this hack! Fix in on model if possible. See #162954.
  if (dialog.rendered) {
    return false;
  }

  dialog.on('remove', function() {
    var formToActivate = this._findFormToActivateAfterDialogRemove();
    if (formToActivate) {
      desktop._setFormActivated(formToActivate);
    } else {
      desktop._setOutlineActivated();
    }
  }.bind(this));

  if (dialog.isPopupWindow()) {
    this._renderPopupWindow(dialog);
  } else {
    dialog.render(desktop.$container);
    this._layoutDialog(dialog);
    desktop._setFormActivated(dialog);

    // Only display the dialog if its 'displayParent' is visible to the user.
    if (!this.displayParent.inFront()) {
      dialog.detach();
    }
  }
};

scout.FormController.prototype._findFormToActivateAfterDialogRemove = function() {
  if (this.displayParent.dialogs.length > 0) {
    return this.displayParent.dialogs[this.displayParent.dialogs.length - 1];
  }
  if (this.displayParent instanceof scout.Form && !this.displayParent.detailForm) {
    // activate display parent, but not if it is the detail form
    return this.displayParent;
  }
  var desktop = this.session.desktop;
  if (desktop.bench) {
    var form = desktop.bench.activeViews()[0];
    if (form instanceof scout.Form && !form.detailForm) {
      return form;
    }
  }
};

scout.FormController.prototype._removeView = function(view, unregister) {
  unregister = scout.nvl(unregister, true);
  if (unregister) {
    scout.arrays.remove(this.displayParent.views, view);
  }
  // in COMPACT case views are already removed.
  if (this.session.desktop.bench) {
    this.session.desktop.bench.removeView(view);
  }
};

scout.FormController.prototype._removeDialog = function(dialog, unregister) {
  unregister = scout.nvl(unregister, true);
  if (unregister) {
    scout.arrays.remove(this.displayParent.dialogs, dialog);
  }
  if (dialog.rendered) {
    dialog.remove();
  }
};

scout.FormController.prototype._activateView = function(view) {
  var bench = this.session.desktop.bench;
  if (bench) {
    // Bench may be null (e.g. in mobile mode). This may probably only happen if the form is not really a view, because otherwise the bench would already be open.
    // Example: form of a FormToolButton has display style set to view but is opened as menu popup rather than in the bench.
    // So this null check is actually a workaround because a better solution would be to never call this function for fake views, but currently it is not possible to identify them easily.
    bench.activateView(view);
  }
};

scout.FormController.prototype._activateDialog = function(dialog) {
  // If the display-parent is a view-form --> activate it always.
  // If it is another dialog --> activate it only if the dialog to activate is modal
  if (dialog.displayParent instanceof scout.Form &&
    (dialog.displayParent.displayHint === scout.Form.DisplayHint.VIEW ||
      (dialog.displayParent.displayHint === scout.Form.DisplayHint.DIALOG && dialog.modal))) {
    this.activateForm(dialog.displayParent);
  }

  if (!dialog.rendered) {
    return;
  }

  // Now the approach is to move all eligible siblings that are in the DOM after the given dialog.
  // It is important not to move the given dialog itself, because this would interfere with the further handling of the
  // mousedown-DOM-event that triggerd this function.
  var movableSiblings = dialog.$container.nextAll().toArray()
    .filter(function(sibling) {
      // siblings of a dialog are movable if they meet the following criteria:
      // - they are forms (sibling forms of a dialog are always dialogs)
      // - they are either
      //     - not modal
      //     - modal
      //         - and not a descendant of the dialog to activate
      //         - and their display parent is not the desktop
      var siblingWidget = scout.widget(sibling);
      return siblingWidget instanceof scout.Form &&
        (!siblingWidget.modal ||
          (!dialog.has(siblingWidget) && siblingWidget.displayParent !== this.session.desktop));
    }, this);

  // All descendants of the so far determined movableSiblings are moveable as well. (E.g. MessageBox, FileChooser)
  var movableSiblingsDescendants = dialog.$container.nextAll().toArray()
    .filter(function(sibling) {
      return scout.arrays.find(movableSiblings, function(movableSibling) {
        var siblingWidget = scout.widget(sibling);
        return !(siblingWidget instanceof scout.Form) && // all movable forms are already captured by the filter above
          scout.widget(movableSibling).has(siblingWidget);
      });
    });
  movableSiblings = movableSiblings.concat(movableSiblingsDescendants);

  dialog.$container.nextAll().toArray()
    .forEach(function(sibling) {
      if (scout.arrays.containsAll(movableSiblings, [sibling])) {
        $(sibling).insertBefore(dialog.$container);
      }
    }.bind(this));

  // Activate the focus context of the form (will restore the previously focused field)
  // This must not be done when the currently focused element is part of this dialog's DOM
  // subtree, even if it has a separate focus context. Otherwise, the dialog would be
  // (unnecessarily) activated, causing the current focus context to lose the focus.
  // Example: editable table with a cell editor popup --> editor should keep the focus
  // when the user clicks the clear icon ("x") inside the editor field.
  if (!dialog.$container.isOrHas(dialog.$container.activeElement())) {
    this.session.focusManager.activateFocusContext(dialog.$container);
  }
};

/**
 * Attaches all dialogs to their original DOM parents.
 * In contrast to 'render', this method uses 'JQuery detach mechanism' to retain CSS properties, so that the model must not be interpreted anew.
 *
 * This method has no effect if already attached.
 */
scout.FormController.prototype.attachDialogs = function() {
  this.displayParent.dialogs.forEach(function(dialog) {
    dialog.attach();
  }, this);
};

/**
 * Detaches all dialogs from their DOM parents. Thereby, modality glassPanes are not detached.
 * In contrast to 'remove', this method uses 'JQuery detach mechanism' to retain CSS properties, so that the model must not be interpreted anew.
 *
 * This method has no effect if already detached.
 */
scout.FormController.prototype.detachDialogs = function() {
  this.displayParent.dialogs.forEach(function(dialog) {
    dialog.detach();
  }, this);
};

scout.FormController.prototype._layoutDialog = function(dialog) {
  var cacheBounds, position;
  dialog.htmlComp.pixelBasedSizing = true;
  dialog.htmlComp.validateLayout();

  cacheBounds = dialog.readCacheBounds();
  if (cacheBounds) {
    position = cacheBounds.point();
  } else {
    position = scout.DialogLayout.positionContainerInWindow(dialog.$container);
  }

  dialog.$container.cssPosition(position);
  dialog.trigger('move', {
    left: position.x,
    top: position.y
  });

  dialog.updateCacheBounds();

  // If not validated anew, focus on single-button forms is not gained.
  // Maybe, this is the same problem as in BusyIndicator.js
  this.session.focusManager.validateFocus();
};
