/*******************************************************************************
 * Copyright (c) 2010 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.ui.html.json.table;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.eclipse.scout.commons.DateUtility;
import org.eclipse.scout.commons.LocaleThreadLocal;
import org.eclipse.scout.rt.client.ui.action.keystroke.IKeyStroke;
import org.eclipse.scout.rt.client.ui.action.menu.root.ContextMenuEvent;
import org.eclipse.scout.rt.client.ui.basic.cell.ICell;
import org.eclipse.scout.rt.client.ui.basic.table.ITable;
import org.eclipse.scout.rt.client.ui.basic.table.ITable5;
import org.eclipse.scout.rt.client.ui.basic.table.ITableRow;
import org.eclipse.scout.rt.client.ui.basic.table.TableEvent;
import org.eclipse.scout.rt.client.ui.basic.table.TableListener;
import org.eclipse.scout.rt.client.ui.basic.table.columns.AbstractDateColumn;
import org.eclipse.scout.rt.client.ui.basic.table.columns.IColumn;
import org.eclipse.scout.rt.client.ui.basic.table.columns.IDateColumn;
import org.eclipse.scout.rt.client.ui.basic.table.columns.INumberColumn;
import org.eclipse.scout.rt.ui.html.json.AbstractJsonPropertyObserver;
import org.eclipse.scout.rt.ui.html.json.IJsonAdapter;
import org.eclipse.scout.rt.ui.html.json.IJsonSession;
import org.eclipse.scout.rt.ui.html.json.JsonEvent;
import org.eclipse.scout.rt.ui.html.json.JsonException;
import org.eclipse.scout.rt.ui.html.json.JsonObjectUtility;
import org.eclipse.scout.rt.ui.html.json.JsonResponse;
import org.eclipse.scout.rt.ui.html.json.form.fields.JsonAdapterProperty;
import org.eclipse.scout.rt.ui.html.json.form.fields.JsonProperty;
import org.eclipse.scout.rt.ui.html.json.menu.IContextMenuOwner;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonTable extends AbstractJsonPropertyObserver<ITable> implements IContextMenuOwner {
  public static final String EVENT_ROW_CLICKED = "rowClicked";
  public static final String EVENT_ROW_ACTION = "rowAction";
  public static final String EVENT_ROWS_SELECTED = "rowsSelected";
  public static final String EVENT_ROWS_DELETED = "rowsDeleted";
  public static final String EVENT_ALL_ROWS_DELETED = "allRowsDeleted";
  public static final String EVENT_RELOAD = "reload";
  public static final String PROP_ROW_IDS = "rowIds";
  public static final String PROP_ROW_ID = "rowId";
  public static final String PROP_CONTROLS = "controls";
  public static final String PROP_SELECTED_ROW_IDS = "selectedRowIds";

  private P_ModelTableListener m_modelTableListener;
  private Map<String, ITableRow> m_tableRows;
  private Map<ITableRow, String> m_tableRowIds;
  private TableEventFilter m_tableEventFilter;

  public JsonTable(ITable model, IJsonSession jsonSession, String id) {
    super(model, jsonSession, id);
    m_tableRows = new HashMap<>();
    m_tableRowIds = new HashMap<>();
    m_tableEventFilter = new TableEventFilter(model);
  }

  @Override
  protected void initJsonProperties(ITable model) {
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_ENABLED, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isEnabled();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_DEFAULT_ICON, model) {
      @Override
      protected String modelValue() {
        return getModel().getDefaultIconId();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_MULTI_SELECT, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isMultiSelect();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_MULTI_CHECK, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isMultiCheck();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_MULTILINE_TEXT, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isMultilineText();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_ROW_HEIGHT_HINT, model) {
      @Override
      protected Integer modelValue() {
        return getModel().getRowHeightHint();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_CHECKABLE, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isCheckable();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_HEADER_VISIBLE, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isHeaderVisible();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_KEYBOARD_NAVIGATION, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().hasKeyboardNavigation();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_AUTO_RESIZE_COLUMNS, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isAutoResizeColumns();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_CONTEXT_COLUMN, model) {
      @Override
      protected IColumn<?> modelValue() {
        return getModel().getContextColumn();
      }

      @Override
      public Object prepareValueForToJson(Object value) {
        // XXX BSH Convert to JSON (or remove property entirely)
        return null;
      }
    });
    /* Commented out by AWE: causes errors in JS because setter for property columnFilterManager
     * does not exist. BSH should check how to solve this.
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_COLUMN_FILTER_MANAGER, model) {
      @Override
      protected ITableColumnFilterManager modelValue() {
        return getModel().getColumnFilterManager();
      }

      @Override
      public Object prepareValueForToJson(Object value) {
        // XXX BSH Convert to JSON (or remove property entirely)
        return null;
      }
    });
     */
    putJsonProperty(new JsonAdapterProperty<ITable>(ITable.PROP_KEY_STROKES, model, getJsonSession()) {
      @Override
      protected List<IKeyStroke> modelValue() {
        return getModel().getKeyStrokes();
      }
    });
    putJsonProperty(new JsonProperty<ITable>(ITable.PROP_SCROLL_TO_SELECTION, model) {
      @Override
      protected Boolean modelValue() {
        return getModel().isScrollToSelection();
      }
    });
//    putJsonProperty(new JsonProperty<ITable, ITypeWithClassId>(ITable.PROP_CONTAINER, model) { //FIXME BSH CGU: only send properties when needed, do we need this one?
//      @Override
//      protected ITypeWithClassId getValueImpl() {
//        return getModel().getContainer();
//      }
//
//      @Override
//      public Object valueToJson(Object value) {
//        // XXX BSH Convert to JSON (or remove property entirely)
//        return null;
//      }
//    });
  }

  @Override
  public String getObjectType() {
    return "Table";
  }

  @Override
  protected void createChildAdapters() {
    super.createChildAdapters();
    attachAdapter(getModel().getContextMenu());
    attachAdapters(getModel().getMenus());
    if (getModel() instanceof ITable5) {
      attachAdapters(((ITable5) getModel()).getControls());
    }
  }

  @Override
  protected void disposeChildAdapters() {
    super.disposeChildAdapters();
    disposeAdapter(getModel().getContextMenu());
    disposeAdapters(getModel().getMenus());
    if (getModel() instanceof ITable5) {
      disposeAdapters(((ITable5) getModel()).getControls());
    }
  }

  @Override
  protected void attachModel() {
    super.attachModel();
    if (m_modelTableListener == null) {
      m_modelTableListener = new P_ModelTableListener();
      getModel().addUITableListener(m_modelTableListener);
    }
  }

  @Override
  protected void detachModel() {
    super.detachModel();
    if (m_modelTableListener != null) {
      getModel().removeTableListener(m_modelTableListener);
      m_modelTableListener = null;
    }
  }

  public TableEventFilter getTableEventFilter() {
    return m_tableEventFilter;
  }

  @Override
  public JSONObject toJson() {
    JSONObject json = super.toJson();
    JSONArray jsonColumns = new JSONArray();
    for (IColumn<?> column : getModel().getColumns()) {
      if (column.isDisplayable()) {
        jsonColumns.put(columnToJson(column));
      }
    }
    putProperty(json, "columns", jsonColumns);
    JSONArray jsonRows = new JSONArray();
    for (ITableRow row : getModel().getRows()) {
      JSONObject jsonRow = tableRowToJson(row);
      jsonRows.put(jsonRow);
    }
    putProperty(json, "rows", jsonRows);
    putAdapterIdsProperty(json, PROP_MENUS, getModel().getMenus());
    if (getModel() instanceof ITable5) {
      putAdapterIdsProperty(json, "controls", ((ITable5) getModel()).getControls());
    }
    putProperty(json, PROP_SELECTED_ROW_IDS, rowIdsToJson(getModel().getSelectedRows()));
    return json;
  }

  @Override
  public void handleUiEvent(JsonEvent event, JsonResponse res) {
    if (EVENT_ROW_CLICKED.equals(event.getType())) {
      handleUiRowClicked(event, res);
    }
    else if (EVENT_ROW_ACTION.equals(event.getType())) {
      handleUiRowAction(event, res);
    }
    else if (EVENT_ROWS_SELECTED.equals(event.getType())) {
      handleUiRowsSelected(event, res);
    }
    else if (EVENT_RELOAD.equals(event.getType())) {
      handleUiReload(event, res);
    }
    else {
      super.handleUiEvent(event, res);
    }
  }

  protected void handleUiRowClicked(JsonEvent event, JsonResponse res) {
    final ITableRow tableRow = extractTableRow(event.getData());
    getModel().getUIFacade().fireRowClickFromUI(tableRow);
  }

  protected void handleUiRowsSelected(JsonEvent event, JsonResponse res) {
    final List<ITableRow> tableRows = extractTableRows(event.getData());
    TableEvent tableEvent = new TableEvent(getModel(), TableEvent.TYPE_ROWS_SELECTED, tableRows);
    getTableEventFilter().addIgnorableModelEvent(tableEvent);
    try {
      getModel().getUIFacade().setSelectedRowsFromUI(tableRows);
    }
    finally {
      getTableEventFilter().removeIgnorableModelEvent(tableEvent);
    }
  }

  protected void handleUiReload(JsonEvent event, JsonResponse res) {
    if (getModel() instanceof ITable5) {
      ((ITable5) getModel()).fireTableReloadFromUI();
    }
  }

  protected void handleUiRowAction(JsonEvent event, JsonResponse res) {
    final ITableRow tableRow = extractTableRow(event.getData());
    getModel().getUIFacade().fireRowActionFromUI(tableRow);
  }

  protected JSONObject tableRowToJson(ITableRow row) {
    JSONArray jsonCells = new JSONArray();
    for (int colIndex = 0; colIndex < row.getCellCount(); colIndex++) {
      IColumn column = row.getTable().getColumnSet().getColumn(colIndex);
      if (column.isDisplayable()) {
        jsonCells.put(cellToJson(row.getCell(colIndex), column));
      }
    }
    JSONObject jsonRow = new JSONObject();
    putProperty(jsonRow, "id", getOrCreatedRowId(row));
    putProperty(jsonRow, "cells", jsonCells);
    return jsonRow;
  }

  protected Object cellToJson(ICell cell, IColumn column) {
    JSONObject jsonCell = new JSONObject();
    putProperty(jsonCell, "value", getCellValue(cell, column));
    putProperty(jsonCell, "foregroundColor", cell.getForegroundColor());
    putProperty(jsonCell, "backgroundColor", cell.getBackgroundColor());
    //FIXME implement missing
    if (jsonCell.length() > 0) {
      putProperty(jsonCell, "text", cell.getText());
      return jsonCell;
    }
    else {
      //Don't generate an object if only the text is returned to reduce the amount of data
      return cell.getText();
    }
  }

  protected Object getCellValue(ICell cell, IColumn column) {
    Object retVal = null;
    if (column instanceof IDateColumn) {
      Date date = (Date) cell.getValue();
      if (date != null) {
        IDateColumn dateColumn = (IDateColumn) column;
        if (dateColumn.isHasDate() && !dateColumn.isHasTime()) {
          retVal = DateUtility.format(date, "yyyy-MM-dd");
        }
        else {
          retVal = date.getTime();
        }
      }
    }
    else if (column instanceof INumberColumn) {
      retVal = cell.getValue();
    }
    //not necessary to send duplicate values
    if (retVal != null && !String.valueOf(retVal).equals(cell.getText())) {
      return retVal;
    }
    return null;
  }

  protected JSONObject columnToJson(IColumn column) {
    try {
      JSONObject json = new JSONObject();
      json.put("id", column.getColumnId());
      json.put("text", column.getHeaderCell().getText());
      json.put("type", computeColumnType(column));
      json.put(IColumn.PROP_WIDTH, column.getWidth());
      json.put("summary", column.isSummary());
      json.put(IColumn.PROP_VISIBLE, column.isVisible());
      json.put(IColumn.PROP_HORIZONTAL_ALIGNMENT, column.getHorizontalAlignment());

      if (column instanceof INumberColumn<?>) {
        //Use localized pattern which contains the relevant chars for the current locale using DecimalFormatSymbols
        json.put("format", ((INumberColumn) column).getFormat().toLocalizedPattern());
      }
      else if (column instanceof IDateColumn) {
        //FIXME CGU update IDateColumnInterface
        //getDateFormat uses LocaleThreadLocal. IMHO getDateFormat should not perform any logic because it just a getter-> refactor. same on AbstractDateField
        //Alternative would be to use a clientJob or set localethreadlocal in ui thread as well, as done in rap
        LocaleThreadLocal.set(getJsonSession().getClientSession().getLocale());
        try {
          Method method = AbstractDateColumn.class.getDeclaredMethod("getDateFormat");
          method.setAccessible(true);
          SimpleDateFormat dateFormat = (SimpleDateFormat) method.invoke(column);
          json.put("format", dateFormat.toPattern()); //Don't use toLocalizedPattern, it translates the chars ('d' to 't' for german).
        }
        finally {
          LocaleThreadLocal.set(null);
        }
      }
      //FIXME complete
      return json;
    }
    catch (JSONException | NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException | InvocationTargetException e) {
      throw new JsonException(e.getMessage(), e);
    }
  }

  protected String computeColumnType(IColumn column) {
    if (column instanceof INumberColumn) {
      return "number";
    }
    if (column instanceof IDateColumn) {
      return "date";
    }
    return "text";
  }

  protected String getOrCreatedRowId(ITableRow row) {
    if (row == null) {
      return null;
    }

    String id = m_tableRowIds.get(row);
    if (id == null) {
      id = getJsonSession().createUniqueIdFor(null);
      m_tableRows.put(id, row);
      m_tableRowIds.put(row, id);
    }
    return id;
  }

  protected JSONArray rowIdsToJson(Collection<ITableRow> modelRows) {
    JSONArray jsonRowIds = new JSONArray();
    for (ITableRow row : modelRows) {
      jsonRowIds.put(getOrCreatedRowId(row));
    }
    return jsonRowIds;
  }

  public List<ITableRow> extractTableRows(JSONObject json) {
    return jsonToTableRows(JsonObjectUtility.getJSONArray(json, PROP_ROW_IDS));
  }

  public ITableRow extractTableRow(JSONObject json) {
    return getTableRowForRowId(JsonObjectUtility.getString(json, PROP_ROW_ID));
  }

  protected List<ITableRow> jsonToTableRows(JSONArray rowIds) {
    List<ITableRow> rows = new ArrayList<>(rowIds.length());
    for (int i = 0; i < rowIds.length(); i++) {
      rows.add(m_tableRows.get(JsonObjectUtility.get(rowIds, i)));
    }
    return rows;
  }

  private ITableRow getTableRowForRowId(String rowId) {
    ITableRow row = m_tableRows.get(rowId);
    if (row == null) {
      throw new JsonException("No row found for id " + rowId);
    }
    return row;
  }

  protected void handleModelTableEventBatch(List<? extends TableEvent> events) {
    for (TableEvent event : events) {
      handleModelTableEvent(event); //FIXME sufficient?
    }
  }

  protected void handleModelTableEvent(TableEvent event) {
    event = getTableEventFilter().filterIgnorableModelEvent(event);
    if (event == null) {
      return;
    }
    switch (event.getType()) {
      case TableEvent.TYPE_ROWS_INSERTED: {
        handleModelRowsInserted(event);
        break;
      }
      case TableEvent.TYPE_ROWS_DELETED: {
        handleModelRowsDeleted(event.getRows());
        break;
      }
      case TableEvent.TYPE_ALL_ROWS_DELETED: {
        handleModelAllRowsDeleted(event.getRows());
        break;
      }
      case TableEvent.TYPE_ROWS_SELECTED: {
        handleModelRowsSelected(event.getRows());
        break;
      }
      case TableEvent.TYPE_ROW_ORDER_CHANGED: {
        handleModelRowOrderChanged(event.getRows());
        break;
      }
    }
  }

  protected void handleModelRowsInserted(TableEvent event) {
    JSONObject jsonEvent = new JSONObject();
    JSONArray jsonRows = new JSONArray();
    for (ITableRow row : event.getRows()) {
      JSONObject jsonRow = tableRowToJson(row);
      jsonRows.put(jsonRow);
    }
    putProperty(jsonEvent, "rows", jsonRows);
    addActionEvent("rowsInserted", jsonEvent);
  }

  protected void handleModelRowsDeleted(Collection<ITableRow> modelRows) {
    JSONObject jsonEvent = new JSONObject();
    putProperty(jsonEvent, PROP_ROW_IDS, rowIdsToJson(modelRows));
    JSONArray jsonRowIds = new JSONArray();
    for (ITableRow row : modelRows) {
      String rowId = m_tableRowIds.get(row);
      jsonRowIds.put(rowId);
      m_tableRowIds.remove(row);
      m_tableRows.remove(rowId);
    }
    addActionEvent(EVENT_ROWS_DELETED, jsonEvent);
  }

  protected void handleModelAllRowsDeleted(Collection<ITableRow> modelRows) {
    addActionEvent(EVENT_ALL_ROWS_DELETED, new JSONObject());
  }

  protected void handleModelRowsSelected(Collection<ITableRow> modelRows) {
    JSONObject jsonEvent = new JSONObject();
    putProperty(jsonEvent, PROP_ROW_IDS, rowIdsToJson(modelRows));
    addActionEvent(EVENT_ROWS_SELECTED, jsonEvent);
  }

  protected void handleModelRowOrderChanged(Collection<ITableRow> modelRows) {
    JSONObject jsonEvent = new JSONObject();
    putProperty(jsonEvent, PROP_ROW_IDS, rowIdsToJson(modelRows));
    JSONArray jsonRowIds = new JSONArray();
    for (ITableRow row : modelRows) {
      String rowId = m_tableRowIds.get(row);
      jsonRowIds.put(rowId);
    }
    addActionEvent("rowOrderChanged", jsonEvent);
  }

  @Override
  public void handleModelContextMenuChanged(ContextMenuEvent event) {
    Collection<IJsonAdapter<?>> menuAdapters = attachAdapters(getModel().getMenus());
    addPropertyChangeEvent(PROP_MENUS, getAdapterIds(menuAdapters));
  }

  private class P_ModelTableListener implements TableListener {
    @Override
    public void tableChanged(final TableEvent e) {
      handleModelTableEvent(e);
    }

    @Override
    public void tableChangedBatch(List<? extends TableEvent> events) {
      handleModelTableEventBatch(events);
    }
  }
}
