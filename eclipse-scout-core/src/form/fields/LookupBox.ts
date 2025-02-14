/*
 * Copyright (c) 2010, 2025 BSI Business Systems Integration AG
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {
  AbstractLayout, arrays, CodeLookupCall, CodeType, HtmlComponent, InitModelOf, LookupBoxEventMap, LookupBoxModel, LookupCall, LookupCallOrModel, LookupResult, LookupRow, objects, PropertyChangeEvent, scout, Status, strings, ValueField,
  Widget
} from '../../index';
import $ from 'jquery';

export abstract class LookupBox<TLookup, TValue = TLookup[]> extends ValueField<TValue, TLookup | TValue> implements LookupBoxModel<TLookup, TValue> {
  declare model: LookupBoxModel<TLookup, TValue>;
  declare eventMap: LookupBoxEventMap<TLookup, TValue>;
  declare self: LookupBox<any>;

  filterBox: Widget;
  lookupCall: LookupCall<TLookup>;
  codeType: string | (new() => CodeType<TLookup>);
  lookupStatus: Status;

  protected _currentLookupCall: LookupCall<TLookup>;
  protected _lookupExecuted: boolean;
  /** true when value is either syncing to table or table to value */
  protected _valueSyncing: boolean;

  constructor() {
    super();
    this.filterBox = null;
    this.gridDataHints.weightY = 1.0;
    this.gridDataHints.h = 2;
    // FIXME cki: prüfen ob das Scherereien macht
    this.value = null;
    this.clearable = ValueField.Clearable.NEVER;
    this.lookupCall = null;
    this._currentLookupCall = null;
    this._lookupExecuted = false;
    this._valueSyncing = false;

    this._addCloneProperties(['lookupCall']);
  }

  static ErrorCode = {
    NO_DATA: 1
  };

  protected override _init(model: InitModelOf<this>) {
    super._init(model);
    if (this.filterBox) {
      this.filterBox.enabledComputed = true; // filter is always enabled
      this.filterBox.recomputeEnabled(true);
      this.filterBox.on('propertyChange', this._onFilterBoxPropertyChange.bind(this));
    }
  }

  protected override _initValue(value: TValue) {
    if (this.lookupCall) {
      this._setLookupCall(this.lookupCall);
    }
    this._setCodeType(this.codeType);
    this._initStructure(value);
    super._initValue(value);
  }

  protected abstract _initStructure(value: TValue);

  protected override _render() {
    this.addContainer(this.$parent, 'lookup-box');
    this.addLabel();
    this.addMandatoryIndicator();
    this.addStatus();
    this.addFieldContainer(this.$parent.makeDiv());

    let htmlComp = HtmlComponent.install(this.$fieldContainer, this.session);
    htmlComp.setLayout(this._createFieldContainerLayout());

    this._ensureLookupCallExecuted();
    this._renderStructure();
    this.$field.addDeviceClass();
    this.$field.addClass('structure');
    this._renderFilterBox();

    this.$container.css('--inactive-lookup-row-suffix-text', `'${this.session.text('InactiveState')}'`);
  }

  protected abstract _createFieldContainerLayout(): AbstractLayout;

  protected abstract _renderStructure();

  protected _renderFilterBox() {
    if (!this.filterBox || !this.filterBox.visible) {
      return;
    }
    this.filterBox.render(this.$fieldContainer);
  }

  // FIXME cki: default-Implementierung finden oder in die ListBox/TreeBox verschieben
  // protected override _ensureValue(value: TLookup | TValue): TValue {
  //   return arrays.ensure(value);
  // }

  protected _lookupByAll(): JQuery.Promise<LookupResult<TLookup>> {
    if (!this.lookupCall) {
      return;
    }

    let deferred = $.Deferred<LookupResult<TLookup>>();

    this._executeLookup(this.lookupCall.cloneForAll(), true)
      .done(result => {
        this._lookupByAllDone(result);
        deferred.resolve(result);
      });

    return deferred.promise();
  }

  protected _executeLookup(lookupCall: LookupCall<TLookup>, abortExisting?: boolean): JQuery.Promise<LookupResult<TLookup>> {
    this.setLoading(true);

    if (abortExisting && this._currentLookupCall) {
      this._currentLookupCall.abort();
    }
    this._currentLookupCall = lookupCall;
    this.trigger('prepareLookupCall', {
      lookupCall: lookupCall
    });

    return lookupCall
      .execute()
      .always(() => {
        this._currentLookupCall = null;
        this._lookupExecuted = true;
        this.setLoading(false);
        this._clearLookupStatus();
      });
  }

  protected _lookupByAllDone(result: LookupResult<TLookup>) {
    try {
      if (result.exception) {
        // Oops! Something went wrong while the lookup has been processed.
        this.setLookupStatus(Status.warning({ // Use warning instead of error to allow form to be closed because user probably cannot fix lookup errors
          message: result.exception
        }));
      }
    } finally {
      this.trigger('lookupCallDone', {
        result: result
      });
    }
  }

  protected override _errorStatus(): Status {
    return this.lookupStatus || this.errorStatus;
  }

  setLookupStatus(lookupStatus: Status) {
    this.setProperty('lookupStatus', lookupStatus);
    if (this.rendered) {
      this._renderErrorStatus();
    }
  }

  override clearErrorStatus() {
    this.setErrorStatus(null);
    this._clearLookupStatus();
  }

  protected _clearLookupStatus() {
    this.setLookupStatus(null);
  }

  /** @see LookupBoxModel.lookupCall */
  setLookupCall(lookupCall: LookupCallOrModel<TLookup>) {
    this.setProperty('lookupCall', lookupCall);
  }

  protected _setLookupCall(lookupCall: LookupCallOrModel<TLookup>) {
    this._setProperty('lookupCall', LookupCall.ensure(lookupCall, this.session));
    this._lookupExecuted = false;
    if (this.rendered) {
      this._ensureLookupCallExecuted();
    }
  }

  /** @see LookupBoxModel.codeType */
  setCodeType(codeType: string | (new() => CodeType<TLookup>)) {
    this.setProperty('codeType', codeType);
  }

  protected _setCodeType(codeType: string | (new() => CodeType<TLookup>)) {
    this._setProperty('codeType', codeType);
    if (!codeType) {
      return;
    }
    let lookupCall = scout.create(CodeLookupCall<TLookup>, {
      session: this.session,
      codeType: codeType
    });
    this.setLookupCall(lookupCall);
  }

  refreshLookup() {
    this._lookupExecuted = false;
    this._ensureLookupCallExecuted();
  }

  /**
   * @returns true if a lookup call execution has been scheduled now. false otherwise.
   */
  protected _ensureLookupCallExecuted(): boolean {
    if (this._lookupExecuted) {
      return false;
    }
    this._lookupByAll();
    return true;
  }

  protected override _formatValue(value: TValue): string | JQuery.Promise<string> {
    if (objects.isNullOrUndefined(value)) {
      return '';
    }

    return this._formatLookupRows(this.getCheckedLookupRows());
  }

  abstract getCheckedLookupRows(): LookupRow<TLookup>[];

  protected _formatLookupRows(lookupRows: LookupRow<TLookup>[]): string {
    lookupRows = arrays.ensure(lookupRows);
    if (lookupRows.length === 0) {
      return '';
    }

    let formatted: string[] = [];
    lookupRows.forEach(row => formatted.push(row.text));
    return strings.join(', ', ...formatted);
  }

  protected override _clear() {
    this.setValue(null);
  }

  protected _onFilterBoxPropertyChange(event: PropertyChangeEvent<any, Widget>) {
    if (event.propertyName === 'visible') {
      if (!this.rendered) {
        return;
      }
      if (this.filterBox.visible) {
        this._renderFilterBox();
      } else {
        this.filterBox.remove();
      }
    }
  }
}
