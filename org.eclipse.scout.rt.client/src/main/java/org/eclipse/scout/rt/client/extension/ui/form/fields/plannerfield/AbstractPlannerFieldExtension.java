/*
 * Copyright (c) 2010, 2023 BSI Business Systems Integration AG
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.scout.rt.client.extension.ui.form.fields.plannerfield;

import java.util.List;

import org.eclipse.scout.rt.client.extension.ui.form.fields.AbstractFormFieldExtension;
import org.eclipse.scout.rt.client.extension.ui.form.fields.plannerfield.PlannerFieldChains.PlannerFieldLoadResourcesChain;
import org.eclipse.scout.rt.client.extension.ui.form.fields.plannerfield.PlannerFieldChains.PlannerFieldPopulateResourcesChain;
import org.eclipse.scout.rt.client.ui.basic.planner.IPlanner;
import org.eclipse.scout.rt.client.ui.basic.planner.Resource;
import org.eclipse.scout.rt.client.ui.form.fields.plannerfield.AbstractPlannerField;

public abstract class AbstractPlannerFieldExtension<P extends IPlanner<RI, AI>, RI, AI, OWNER extends AbstractPlannerField<P, RI, AI>> extends AbstractFormFieldExtension<OWNER> implements IPlannerFieldExtension<P, RI, AI, OWNER> {

  public AbstractPlannerFieldExtension(OWNER owner) {
    super(owner);
  }

  @Override
  public List<Resource<RI>> execLoadResources(PlannerFieldLoadResourcesChain<? extends IPlanner<RI, AI>, RI, AI> chain) {
    return chain.execLoadResourceTableData();
  }

  @Override
  public void execPopulateResources(PlannerFieldPopulateResourcesChain<? extends IPlanner<RI, AI>, RI, AI> chain) {
    chain.execPopulateResources();
  }
}
