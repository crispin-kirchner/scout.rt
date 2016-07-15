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
/* global FormSpecHelper */
describe("BasicField", function() {
  var session, helper, field;

  beforeEach(function() {
    setFixtures(sandbox());
    session = sandboxSession();
    helper = new FormSpecHelper(session);
    field = createField(createModel());
    jasmine.Ajax.install();
    jasmine.clock().install();
  });

  afterEach(function() {
    jasmine.clock().uninstall();
    jasmine.Ajax.uninstall();
  });

  function createField(model) {
    var field = new scout.BasicField();
    field._render = function() {};
    field.$container = $('<div>');
    field.$field = $('<input>').on('blur', field._onFieldBlur.bind(field));
    field.init(model);
    return field;
  }

  function createModel() {
    return helper.createFieldModel();
  }

  describe("displayTextChanged must always be sent to server at the end of input, if at least one change has been was made", function() {
    it("updateDisplayTextOnModify = true, with changed text", function() {
      field.updateDisplayTextOnModify = true;
      field.render(session.$entryPoint);
      field.$field.val('Test1');
      field.$field.trigger('input');
      jasmine.clock().tick(251); // because of debounce
      sendQueuedAjaxCalls();
      var event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test1',
        whileTyping: true
      });
      expect(mostRecentJsonRequest()).toContainEvents(event);
      field.$field.triggerBlur();
      sendQueuedAjaxCalls();
      event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test1',
        whileTyping: false
      });
      expect(mostRecentJsonRequest()).toContainEvents(event);
    });

    it("updateDisplayTextOnModify = false, with changed text", function() {
      field.updateDisplayTextOnModify = false;
      field.render(session.$entryPoint);
      field.$field.val('Test2');
      field.$field.trigger('input');
      sendQueuedAjaxCalls();
      var event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test2',
        whileTyping: true
      });
      expect(mostRecentJsonRequest()).not.toContainEvents(event);
      field.$field.triggerBlur();
      sendQueuedAjaxCalls();
      event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test2',
        whileTyping: false
      });
      expect(mostRecentJsonRequest()).toContainEvents(event);
    });

    it("updateDisplayTextOnModify = true, then property change to updateDisplayTextOnModify = false, with changed text", function() {
      field.updateDisplayTextOnModify = true;
      field.render(session.$entryPoint);
      field.$field.val('Test3');
      field.$field.trigger('input');
      jasmine.clock().tick(251); // because of debounce
      sendQueuedAjaxCalls();
      var event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test3',
        whileTyping: true
      });
      expect(mostRecentJsonRequest()).toContainEvents(event);
      event = createPropertyChangeEvent(field, {
        "updateDisplayTextOnModify": false
      });
      field.onModelPropertyChange(event);
      field.$field.triggerBlur();
      sendQueuedAjaxCalls();
      event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test3',
        whileTyping: false
      });
      expect(mostRecentJsonRequest()).toContainEvents(event);
    });

    it("updateDisplayTextOnModify = true, then acceptInput(false) is fired. -> send should be done immediately", function() {
      field.updateDisplayTextOnModify = true;
      field.render(session.$entryPoint);
      field.$field.val('Test3');
      field.$field.trigger('input');
      field.acceptInput(false);
      sendQueuedAjaxCalls();
      var event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test3',
        whileTyping: true
      });
      expect(mostRecentJsonRequest()).toContainEvents(event);
    });

    it("updateDisplayTextOnModify = true, w/o changed text", function() {
      field.updateDisplayTextOnModify = true;
      field.render(session.$entryPoint);
      field.displayText = 'Test4'; // fake previous display text
      field.$field.val('Test4');
      field.$field.trigger('input');
      sendQueuedAjaxCalls();
      var event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test4',
        whileTyping: true
      });
      expect(mostRecentJsonRequest()).not.toContainEvents(event);
      field.$field.triggerBlur();
      sendQueuedAjaxCalls();
      event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test4',
        whileTyping: false
      });
      expect(mostRecentJsonRequest()).not.toContainEvents(event);
    });

    it("updateDisplayTextOnModify = false, w/o changed text", function() {
      field.updateDisplayTextOnModify = false;
      field.render(session.$entryPoint);
      field.displayText = 'Test5'; // fake previous display text
      field.$field.val('Test5');
      field.$field.trigger('input');
      sendQueuedAjaxCalls();
      var event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test5',
        whileTyping: true
      });
      expect(mostRecentJsonRequest()).not.toContainEvents(event);
      field.$field.triggerBlur();
      sendQueuedAjaxCalls();
      event = new scout.Event(field.id, 'displayTextChanged', {
        displayText: 'Test5',
        whileTyping: false
      });
      expect(mostRecentJsonRequest()).not.toContainEvents(event);
    });

    it("does not fail if field is removed while acceptInput is still pending", function() {
      field.updateDisplayTextOnModify = true;
      field.render(session.$entryPoint);
      field.$field.val('Test1');
      field.$field.trigger('input');

      field.remove();
      jasmine.clock().tick(251); // because of debounce
      // expect not to fail
    });
  });

});
