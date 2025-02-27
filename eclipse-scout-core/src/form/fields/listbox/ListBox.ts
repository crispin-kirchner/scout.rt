/*
 * Copyright (c) 2010, 2025 BSI Business Systems Integration AG
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {AbstractListBox, arrays, ListBoxModel} from '../../../index';

export class ListBox<TLookup> extends AbstractListBox<TLookup, TLookup[]> implements ListBoxModel<TLookup, TLookup[]> {
  declare model: ListBoxModel<TLookup, TLookup[]>;

  protected override _valueToTable(newValue: TLookup[]) {
    let opts = {checkOnlyEnabled: false};

    let rowsToCheck = [];

    this.table.uncheckRows(this.table.rows, opts);
    this.table.rows.forEach(row => {
      if (arrays.containsAny(newValue, row.lookupRow.key)) {
        rowsToCheck.push(row);
      }
    }, this);
    this.table.checkRows(rowsToCheck, opts);
  }

  protected override _tableToValue(): TLookup[] {
    const valueArray: TLookup[] = [];
    this.table.rows.forEach(row => {
      if (row.checked) {
        valueArray.push(row.lookupRow.key);
      }
    });
    return valueArray;
  }
}
