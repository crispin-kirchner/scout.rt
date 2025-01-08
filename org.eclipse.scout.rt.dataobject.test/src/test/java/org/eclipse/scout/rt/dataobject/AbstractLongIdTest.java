/*
 * Copyright (c) 2010, 2025 BSI Business Systems Integration AG
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.scout.rt.dataobject;

import static org.junit.Assert.*;

import org.eclipse.scout.rt.dataobject.fixture.FixtureLongId;
import org.eclipse.scout.rt.dataobject.fixture.FixtureLongIdWithoutTypeName;
import org.junit.Test;

public class AbstractLongIdTest {

  protected static final Long TEST_ID = 42L;
  protected static final FixtureLongId FIXTURE_ID_1 = FixtureLongId.of(TEST_ID);

  @Test
  public void testCompareTo_null() {
    assertEquals(1, FIXTURE_ID_1.compareTo(null));
  }

  @Test
  public void testCompareTo_sameValue() {
    assertEquals(0, FIXTURE_ID_1.compareTo(FixtureLongId.of(TEST_ID)));
    assertEquals(0, FIXTURE_ID_1.compareTo(FixtureLongIdWithoutTypeName.of(TEST_ID)));
  }

  @Test
  public void testCompareTo_otherValue() {
    FixtureLongId id1 = FixtureLongId.of(-42L);
    FixtureLongId id2 = FixtureLongId.of(42L);
    assertTrue(id1.compareTo(id2) < 0);
    assertTrue(id2.compareTo(id1) > 0);
  }
}
