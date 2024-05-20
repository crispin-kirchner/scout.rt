/*
 * Copyright (c) 2010, 2024 BSI Business Systems Integration AG
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {arrays, Dimension, HtmlComponent, HtmlCompPrefSizeOptions, InitModelOf, Insets, LayoutConstants, LogicalGridData, LogicalGridLayoutInfoModel, Rectangle, TreeSet} from '../../index';
import $ from 'jquery';

/**
 * JavaScript port of org.eclipse.scout.rt.ui.swing.LogicalGridLayoutInfo.
 */
export class LogicalGridLayoutInfo implements LogicalGridLayoutInfoModel {
  declare model: LogicalGridLayoutInfoModel;

  gridDatas: LogicalGridData[];
  cons: LogicalGridData[];
  cols: number;
  compSize: Dimension[];
  rows: number;
  width: number[][];
  widthHints: number[];
  height: number[][];
  weightX: number[];
  weightY: number[];
  hgap: number;
  vgap: number;
  rowHeight: number;
  columnWidth: number;
  cellBounds: Rectangle[][];
  widthHint: number;
  widthOnly: boolean;
  $components: JQuery[];

  constructor(model: InitModelOf<LogicalGridLayoutInfo>) {
    this.gridDatas = [];
    this.$components = null;
    this.cols = 0;
    this.compSize = [];
    this.rows = 0;
    this.width = [];
    this.widthHints = [];
    this.height = [];
    this.weightX = [];
    this.weightY = [];
    this.hgap = 0;
    this.vgap = 0;
    this.rowHeight = 0;
    this.columnWidth = 0;
    this.cellBounds = [];
    this.widthHint = null;
    this.widthOnly = false;
    $.extend(this, model);

    // create a modifiable copy of the grid datas
    let i, gd, x, y;
    for (i = 0; i < this.cons.length; i++) {
      this.gridDatas[i] = new LogicalGridData(this.cons[i]);
    }
    if (this.$components.length === 0) {
      return;
    }
    // eliminate unused rows and columns
    let usedCols = new TreeSet();
    let usedRows = new TreeSet();
    // ticket 86645 use member gridDatas instead of param cons
    for (i = 0; i < this.gridDatas.length; i++) {
      gd = this.gridDatas[i];
      if (gd.gridx < 0) {
        gd.gridx = 0;
      }
      if (gd.gridy < 0) {
        gd.gridy = 0;
      }
      if (gd.gridw < 1) {
        gd.gridw = 1;
      }
      if (gd.gridh < 1) {
        gd.gridh = 1;
      }
      for (x = gd.gridx; x < gd.gridx + gd.gridw; x++) {
        usedCols.add(x);
      }
      for (y = gd.gridy; y < gd.gridy + gd.gridh; y++) {
        usedRows.add(y);
      }
    }
    let maxCol = usedCols.last();
    for (x = maxCol; x >= 0; x--) {
      if (!usedCols.contains(x)) {
        // eliminate column
        // ticket 86645 use member gridDatas instead of param cons
        for (i = 0; i < this.gridDatas.length; i++) {
          gd = this.gridDatas[i];
          if (gd.gridx > x) {
            gd.gridx--;
          }
        }
      }
    }
    let maxRow = usedRows.last();
    for (y = maxRow; y >= 0; y--) {
      if (!usedRows.contains(y)) {
        // eliminate row
        // ticket 86645 use member gridDatas instead of param cons
        for (i = 0; i < this.gridDatas.length; i++) {
          gd = this.gridDatas[i];
          if (gd.gridy > y) {
            // ticket 86645
            gd.gridy--;
          }
        }
      }
    }
    this.cols = usedCols.size();
    this.rows = usedRows.size();

    $.log.isTraceEnabled() && $.log.trace('(LogicalGridLayoutInfo#CTOR) $components.length=' + this.$components.length + ' usedCols=' + this.cols + ' usedRows=' + this.rows);
    this._initializeInfo();
  }

  protected _initializeInfo() {
    let compCount = this.$components.length;
    let uiHeightElements = [];
    for (let i = 0; i < compCount; i++) {
      // cleanup constraints
      let $comp = this.$components[i];
      let cons = this.gridDatas[i];
      if (cons.gridx < 0) {
        cons.gridx = 0;
      }
      if (cons.gridy < 0) {
        cons.gridy = 0;
      }
      if (cons.gridw < 1) {
        cons.gridw = 1;
      }
      if (cons.gridh < 1) {
        cons.gridh = 1;
      }
      if (cons.gridx >= this.cols) {
        cons.gridx = this.cols - 1;
      }
      if (cons.gridy >= this.rows) {
        cons.gridy = this.rows - 1;
      }
      if (cons.gridx + cons.gridw - 1 >= this.cols) {
        cons.gridw = this.cols - cons.gridx;
      }
      if (cons.gridy + cons.gridh >= this.rows) {
        cons.gridh = this.rows - cons.gridy;
      }

      // Calculate and cache component size
      let size = new Dimension(0, 0);
      if (cons.widthHint > 0) {
        // Use explicit width hint, if set
        size.width = cons.widthHint;
        // eslint-disable-next-line brace-style
      } else if (cons.useUiWidth || !cons.fillHorizontal) {
        // Calculate preferred width otherwise
        // This size is needed by _initializeColumns
        // But only if really needed by the logical grid layout (because it is expensive)
        size = this.uiSizeInPixel($comp);
      }
      if (cons.heightHint > 0) {
        // Use explicit height hint, if set
        size.height = cons.heightHint;
      } else if (cons.useUiHeight || !cons.fillVertical) {
        // Otherwise check if preferred height should be calculated.
        // Don't do it now because weightX need to be calculated first to get the correct width hints
        uiHeightElements.push({
          cons: cons,
          $comp: $comp,
          index: i
        });
      }
      this.compSize[i] = size;
    }

    // Calculate this.width and this.weightX
    this._initializeColumns();

    if (this.widthOnly) {
      // Abort here if only width is of interest
      this.height = arrays.init(this.rows, [0, 0, 0]);
      return;
    }

    // Calculate preferred heights using the width hints
    if (this.widthHint && uiHeightElements.length > 0) {
      let totalHGap = Math.max(0, (this.cols - 1) * this.hgap);
      this.widthHints = this.layoutSizes(this.widthHint - totalHGap, this.width, this.weightX);
    }
    uiHeightElements.forEach(elem => {
      let $comp = elem.$comp;
      let cons = elem.cons;
      let widthHint = this.widthHintForGridData(cons);
      if (!cons.fillHorizontal) {
        widthHint = Math.min(widthHint, this.compSize[elem.index].width);
      }
      this.compSize[elem.index] = this.uiSizeInPixel($comp, {
        widthHint: widthHint
      });
    });

    // Calculate this.height and this.weightY
    this._initializeRows();
  }

  protected _initializeColumns() {
    let compSize = this.compSize;
    let compCount = compSize.length;
    let prefWidths = arrays.init(this.cols, 0);
    let maxWidths = arrays.init(this.cols, 10240);
    let fixedWidths = arrays.init(this.cols, false);
    for (let i = 0; i < compCount; i++) {
      let cons = this.gridDatas[i];

      if (cons.gridw === 1) {
        let prefw;
        if (cons.widthHint > 0) {
          prefw = cons.widthHint;
        } else if (cons.useUiWidth) {
          prefw = compSize[i].width;
        } else {
          prefw = this.logicalWidthInPixel(cons);
        }
        prefw = Math.floor(prefw);
        for (let j = cons.gridx; j < cons.gridx + cons.gridw && j < this.cols; j++) {
          prefWidths[j] = Math.max(prefWidths[j], prefw);
          maxWidths[j] = Math.min(maxWidths[j], cons.maxWidth);
          if (cons.weightx === 0) {
            fixedWidths[j] = true;
          }
        }
      }
    }
    const lc = LayoutConstants;
    for (let i = 0; i < compCount; i++) {
      let cons = this.gridDatas[i];
      if (cons.gridw > 1) {
        let hSpan = cons.gridw;
        let spanWidth = [0, 0, 0];
        let distWidth = [0, 0, 0];
        for (let j = cons.gridx; j < cons.gridx + cons.gridw && j < this.cols; j++) {
          if (!fixedWidths[j]) {
            spanWidth[lc.PREF] += prefWidths[j];
            spanWidth[lc.MAX] += maxWidths[j];
          }
        }
        let hGaps = (hSpan - 1) * this.hgap;
        if (cons.widthHint > 0) {
          distWidth[lc.PREF] = cons.widthHint - spanWidth[lc.PREF] - hGaps;
        } else if (cons.useUiWidth) {
          distWidth[lc.PREF] = compSize[i].width - spanWidth[lc.PREF] - hGaps;
        } else {
          distWidth[lc.PREF] = this.logicalWidthInPixel(cons) - spanWidth[lc.PREF] - hGaps;
        }
        if (distWidth[lc.PREF] > 0) {
          this._distributeWidth(cons, distWidth[lc.PREF], spanWidth[lc.PREF], prefWidths, fixedWidths, Math.max.bind(Math));
        }
        distWidth[lc.MAX] = cons.maxWidth - spanWidth[lc.MAX] - hGaps;
        this._distributeWidth(cons, distWidth[lc.MAX], spanWidth[lc.MAX], maxWidths, fixedWidths, Math.min.bind(Math));
      }
    }

    for (let i = 0; i < this.cols; i++) {
      this.width[i] = [];
      if (fixedWidths[i]) {
        this.width[i][lc.MIN] = prefWidths[i];
        this.width[i][lc.PREF] = prefWidths[i];
        this.width[i][lc.MAX] = Math.min(prefWidths[i], maxWidths[i]);
      } else {
        this.width[i][lc.MIN] = 0; // must be exactly 0!
        this.width[i][lc.PREF] = prefWidths[i];
        this.width[i][lc.MAX] = maxWidths[i];
      }
    }

    // averaged column weights, normalized so that sum of weights is equal to
    // 1.0
    for (let i = 0; i < this.cols; i++) {
      if (fixedWidths[i]) {
        this.weightX[i] = 0;
      } else {
        let weightSum = 0;
        let weightCount = 0;
        for (let k = 0; k < compCount; k++) {
          let cons = this.gridDatas[k];
          if (cons.weightx > 0 && cons.gridx <= i && i <= cons.gridx + cons.gridw - 1) {
            weightSum += (cons.weightx / cons.gridw);
            weightCount++;
          }
        }
        this.weightX[i] = (weightCount > 0 ? weightSum / weightCount : 0);
      }
    }
    let sumWeightX = 0;
    for (let i = 0; i < this.cols; i++) {
      sumWeightX += this.weightX[i];
    }
    if (sumWeightX >= 1e-6) {
      let f = 1.0 / sumWeightX;
      for (let i = 0; i < this.cols; i++) {
        this.weightX[i] = this.weightX[i] * f;
      }
    }
  }

  /**
   * @param cons the current grid data
   * @param distWidth the widths to distribute to the columns. The widgets are distributed to the columns equally.
   * @param spanWidth the cumulated width of every cell of every row visited so far in the span range [grid.x, grid.x + grid.w]
   * @param widths the column widths that have been distributed so far when the previous rows were visited
   * @param fixedWidths the columns with a fixed width (weightx = 0)
   * @param calc the function that decides whether to use the newly calculated column width or the existing one
   */
  protected _distributeWidth<T>(cons: LogicalGridData, distWidth: number, spanWidth: number, widths: number[], fixedWidths: boolean[], calc: (equalWidth: number, width: number) => number) {
    let hSpan = cons.gridw;
    let equalWidth = Math.floor((distWidth + spanWidth) / hSpan);
    let remainder = (distWidth + spanWidth) % hSpan;
    let last = -1;
    for (let j = cons.gridx; j < cons.gridx + cons.gridw && j < this.cols; j++) {
      last = j;
      if (!fixedWidths[j]) {
        widths[j] = calc(equalWidth, widths[j]);
      }
      if (cons.weightx === 0) {
        fixedWidths[j] = true;
      }
    }
    if (last > -1) {
      widths[last] += remainder;
    }
  }

  /**
   * @param cons the current grid data
   * @param distHeight the heights to distribute to the rows. The widgets are distributed to the rows equally.
   * @param spanHeight the cumulated height of every cell of every column visited so far in the span range [grid.y, grid.y + grid.h]
   * @param widths the row heights that have been distributed so far when the previous column were visited
   * @param fixedHeights the rows with a fixed height (weighty = 0)
   */
  protected _distributeHeight<T>(cons: LogicalGridData, distHeight: number, spanHeight: number, heights: number[], fixedHeights: boolean[], calc: (equalWidth: number, width: number) => number) {
    let vSpan = cons.gridh;
    let equalHeight = Math.floor((distHeight + spanHeight) / vSpan);
    let remainder = (distHeight + spanHeight) % vSpan;
    let last = -1;
    for (let j = cons.gridy; j < cons.gridy + cons.gridh && j < this.rows; j++) {
      last = j;
      if (!fixedHeights[j]) {
        heights[j] = calc(equalHeight, heights[j]);
      }
      if (cons.weighty === 0) {
        fixedHeights[j] = true;
      }
    }
    if (last > -1) {
      heights[last] += remainder;
    }
  }

  protected _initializeRows() {
    let compSize = this.compSize;
    let compCount = compSize.length;
    let prefHeights = arrays.init(this.rows, 0);
    let maxHeights = arrays.init(this.rows, 10240);
    let fixedHeights = arrays.init(this.rows, false);
    for (let i = 0; i < compCount; i++) {
      let cons = this.gridDatas[i];
      if (cons.gridh === 1) {
        let prefh;
        if (cons.heightHint > 0) {
          prefh = cons.heightHint;
        } else if (cons.useUiHeight) {
          prefh = compSize[i].height;
        } else {
          prefh = this.logicalHeightInPixel(cons);
        }
        prefh = Math.floor(prefh);
        for (let j = cons.gridy; j < cons.gridy + cons.gridh && j < this.rows; j++) {
          prefHeights[j] = Math.max(prefHeights[j], prefh);
          maxHeights[j] = Math.min(maxHeights[j], cons.maxHeight);
          if (cons.weighty === 0) {
            fixedHeights[j] = true;
          }
        }
      }
    }
    const lc = LayoutConstants;
    for (let i = 0; i < compCount; i++) {
      let cons = this.gridDatas[i];
      if (cons.gridh > 1) {
        let vSpan = cons.gridh;
        let spanHeight = [0, 0, 0];
        let distHeight = [0, 0, 0];
        for (let j = cons.gridy; j < cons.gridy + cons.gridh && j < this.rows; j++) {
          if (!fixedHeights[j]) {
            spanHeight[lc.PREF] += prefHeights[j];
            spanHeight[lc.MAX] += maxHeights[j];
          }
        }
        let vGaps = (vSpan - 1) * this.vgap;
        if (cons.heightHint > 0) {
          distHeight[lc.PREF] = cons.heightHint - spanHeight[lc.PREF] - vGaps;
        } else if (cons.useUiHeight) {
          distHeight[lc.PREF] = compSize[i].height - spanHeight[lc.PREF] - vGaps;
        } else {
          distHeight[lc.PREF] = this.logicalHeightInPixel(cons) - spanHeight[lc.PREF] - vGaps;
        }
        if (distHeight[lc.PREF] > 0) {
          this._distributeHeight(cons, distHeight[lc.PREF], spanHeight[lc.PREF], prefHeights, fixedHeights, Math.max.bind(this));
        }
        distHeight[lc.MAX] = cons.maxHeight - spanHeight[lc.MAX] - vGaps;
        this._distributeHeight(cons, distHeight[lc.MAX], spanHeight[lc.MAX], maxHeights, fixedHeights, Math.min.bind(this));
      }
    }

    for (let i = 0; i < this.rows; i++) {
      this.height[i] = [];
      if (fixedHeights[i]) {
        this.height[i][lc.MIN] = prefHeights[i];
        this.height[i][lc.PREF] = prefHeights[i];
        this.height[i][lc.MAX] = Math.min(prefHeights[i], maxHeights[i]);
      } else {
        this.height[i][lc.MIN] = 0; // must be exactly 0!
        this.height[i][lc.PREF] = prefHeights[i];
        this.height[i][lc.MAX] = maxHeights[i];
      }
    }

    // averaged row weights, normalized so that sum of weights is equal to 1.0
    for (let i = 0; i < this.rows; i++) {
      if (fixedHeights[i]) {
        this.weightY[i] = 0;
      } else {
        let weightSum = 0;
        let weightCount = 0;
        for (let k = 0; k < compCount; k++) {
          let cons = this.gridDatas[k];
          if (cons.weighty > 0 && cons.gridy <= i && i <= cons.gridy + cons.gridh - 1) {
            weightSum += (cons.weighty / cons.gridh);
            weightCount++;
          }
        }
        this.weightY[i] = (weightCount > 0 ? weightSum / weightCount : 0);
      }
    }
    let sumWeightY = 0;
    for (let i = 0; i < this.rows; i++) {
      sumWeightY += this.weightY[i];
    }
    if (sumWeightY >= 1e-6) {
      let f = 1.0 / sumWeightY;
      for (let i = 0; i < this.rows; i++) {
        this.weightY[i] = this.weightY[i] * f;
      }
    }
  }

  layoutCellBounds(size: Dimension, insets: Insets): Rectangle[][] {
    let w = this.layoutSizes(size.width - insets.horizontal() - Math.max(0, (this.cols - 1) * this.hgap), this.width, this.weightX);
    let h = this.layoutSizes(size.height - insets.vertical() - Math.max(0, (this.rows - 1) * this.vgap), this.height, this.weightY);
    this.cellBounds = arrays.init(this.rows, null);
    let y = insets.top;
    for (let r = 0; r < this.rows; r++) {
      let x = insets.left;
      this.cellBounds[r] = arrays.init(this.cols, null);
      for (let c = 0; c < this.cols; c++) {
        this.cellBounds[r][c] = new Rectangle(x, y, w[c], h[r]);
        x += w[c];
        x += this.hgap;
      }
      y += h[r];
      y += this.vgap;
    }
    return this.cellBounds;
  }

  layoutSizes(targetSize: number, sizes: number[][], weights: number[]): number[] {
    let outSizes = arrays.init(sizes.length, 0);
    if (targetSize <= 0) {
      for (let i = 0; i < sizes.length; i++) {
        outSizes[i] = sizes[i][LayoutConstants.MIN];
      }
      return outSizes;
    }
    let sumSize = 0;
    let tmpWeight = arrays.init(weights.length, 0.0);
    let sumWeight = 0;
    for (let i = 0; i < sizes.length; i++) {
      outSizes[i] = Math.min(Math.max(sizes[i][LayoutConstants.PREF], sizes[i][LayoutConstants.MIN]), sizes[i][LayoutConstants.MAX]);
      sumSize += outSizes[i];
      tmpWeight[i] = weights[i];
      /**
       * autocorrection: if weight is 0 and min / max sizes are NOT equal then
       * set weight to 1; if weight<eps set it to 0
       */
      if (tmpWeight[i] < LayoutConstants.EPS) {
        if (sizes[i][LayoutConstants.MAX] > sizes[i][LayoutConstants.MIN]) {
          tmpWeight[i] = 1;
        } else {
          tmpWeight[i] = 0;
        }
      }
      sumWeight += tmpWeight[i];
    }
    // normalize weights
    if (sumWeight > 0) {
      for (let i = 0; i < tmpWeight.length; i++) {
        tmpWeight[i] = tmpWeight[i] / sumWeight;
      }
    }
    let deltaInt = targetSize - sumSize;
    // expand or shrink
    if (Math.abs(deltaInt) > 0) {
      // setup accumulators
      /* float[] */
      let accWeight = arrays.init(tmpWeight.length, 0.0);
      let hasTargets;
      if (deltaInt > 0) {
        // expand, if delta is > 0
        hasTargets = true;
        while (deltaInt > 0 && hasTargets) {
          hasTargets = false;
          for (let i = 0; i < outSizes.length && deltaInt > 0; i++) {
            if (tmpWeight[i] > 0 && outSizes[i] < sizes[i][LayoutConstants.MAX]) {
              hasTargets = true;
              accWeight[i] += tmpWeight[i];
              if (accWeight[i] > 0) {
                accWeight[i] -= 1;
                outSizes[i] += 1;
                deltaInt -= 1;
              }
            }
          }
        }
      } else {
        // shrink, if delta is <= 0
        hasTargets = true;
        while (deltaInt < 0 && hasTargets) {
          hasTargets = false;
          for (let i = 0; i < outSizes.length && deltaInt < 0; i++) {
            if (tmpWeight[i] > 0 && outSizes[i] > sizes[i][LayoutConstants.MIN]) {
              hasTargets = true;
              accWeight[i] += tmpWeight[i];
              if (accWeight[i] > 0) {
                accWeight[i] -= 1;
                outSizes[i] -= 1;
                deltaInt += 1;
              }
            }
          }
        }
      }
    }
    return outSizes;
  }

  logicalWidthInPixel(cons: LogicalGridData): number {
    let gridW = cons.gridw;
    return (this.columnWidth * gridW) + (this.hgap * Math.max(0, gridW - 1));
  }

  logicalHeightInPixel(cons: LogicalGridData): number {
    let gridH = cons.gridh;
    let addition = cons.logicalRowHeightAddition || 0;
    return (this.rowHeight * gridH) + (this.vgap * Math.max(0, gridH - 1)) + addition;
  }

  uiSizeInPixel($comp: JQuery, options?: HtmlCompPrefSizeOptions): Dimension {
    let htmlComp = HtmlComponent.get($comp);
    return htmlComp.prefSize(options).add(htmlComp.margins());
  }

  /**
   * @returns the width hint for the given gridData
   */
  widthHintForGridData(gridData: LogicalGridData): number | null {
    if (this.widthHints.length === 0) {
      return null;
    }
    let widthHint = (gridData.gridw - 1) * this.hgap;
    for (let i = gridData.gridx; i < gridData.gridx + gridData.gridw; i++) {
      widthHint += this.widthHints[i];
    }
    return widthHint;
  }
}
