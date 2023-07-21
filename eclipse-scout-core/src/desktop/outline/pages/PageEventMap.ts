/*
 * Copyright (c) 2010, 2023 BSI Business Systems Integration AG
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {Event, EventMap, Form, Page, PropertyChangeEvent, Table} from '../../../index';

export interface PageEventMap extends EventMap {
  'propertyChange:detailForm': PropertyChangeEvent<Form>;
  'propertyChange:detailTable': PropertyChangeEvent<Table>;
  'destroying': Event<Page>;
  'destroy': Event<Page>;
}
