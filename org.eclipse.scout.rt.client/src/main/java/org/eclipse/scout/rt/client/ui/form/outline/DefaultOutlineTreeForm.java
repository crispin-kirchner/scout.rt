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
package org.eclipse.scout.rt.client.ui.form.outline;

import org.eclipse.scout.commons.annotations.Order;
import org.eclipse.scout.commons.exception.ProcessingException;
import org.eclipse.scout.rt.client.session.ClientSessionProvider;
import org.eclipse.scout.rt.client.ui.basic.tree.ITree;
import org.eclipse.scout.rt.client.ui.desktop.DesktopEvent;
import org.eclipse.scout.rt.client.ui.desktop.DesktopListener;
import org.eclipse.scout.rt.client.ui.desktop.IDesktop;
import org.eclipse.scout.rt.client.ui.desktop.outline.IOutlineTreeForm;
import org.eclipse.scout.rt.client.ui.form.AbstractForm;
import org.eclipse.scout.rt.client.ui.form.AbstractFormHandler;
import org.eclipse.scout.rt.client.ui.form.fields.groupbox.AbstractGroupBox;
import org.eclipse.scout.rt.client.ui.form.fields.treefield.AbstractTreeField;
import org.eclipse.scout.rt.client.ui.form.outline.DefaultOutlineTreeForm.MainBox.OutlineTreeField;

public class DefaultOutlineTreeForm extends AbstractForm implements IOutlineTreeForm {
  private DesktopListener m_desktopListener;

  public DefaultOutlineTreeForm() throws ProcessingException {
    super();
  }

  @Override
  protected boolean getConfiguredAskIfNeedSave() {
    return false;
  }

  @Override
  protected boolean getConfiguredCacheBounds() {
    return true;
  }

  @Override
  protected int getConfiguredDisplayHint() {
    return DISPLAY_HINT_VIEW;
  }

  @Override
  protected String getConfiguredDisplayViewId() {
    return VIEW_ID_OUTLINE;
  }

  @Override
  protected void execInitForm() throws ProcessingException {
    m_desktopListener = new DesktopListener() {
      @Override
      public void desktopChanged(DesktopEvent e) {
        switch (e.getType()) {
          case DesktopEvent.TYPE_OUTLINE_CHANGED: {
            installTree(e.getOutline());
            break;
          }
        }
      }

    };
    IDesktop desktop = ClientSessionProvider.currentSession().getDesktop();
    desktop.addDesktopListener(m_desktopListener);
    installTree(desktop.getOutline());

  }

  @Override
  protected void execDisposeForm() throws ProcessingException {
    super.execDisposeForm();
    ClientSessionProvider.currentSession().getDesktop().removeDesktopListener(m_desktopListener);
    m_desktopListener = null;
  }

  private void installTree(ITree tree) {
    getOutlineTreeField().setTree(tree, true);
    if (tree != null) {
      setTitle(tree.getTitle());
      setIconId(tree.getIconId());
    }
  }

  public MainBox getMainBox() {
    return (MainBox) getRootGroupBox();
  }

  public OutlineTreeField getOutlineTreeField() {
    return getFieldByClass(OutlineTreeField.class);
  }

  public void startView() throws ProcessingException {
    startInternal(new ViewHandler());
  }

  @Order(10.0f)
  public class MainBox extends AbstractGroupBox {

    @Override
    protected boolean getConfiguredBorderVisible() {
      return false;
    }

    @Override
    protected String getConfiguredBorderDecoration() {
      return BORDER_DECORATION_EMPTY;
    }

    @Override
    protected int getConfiguredGridColumnCount() {
      return 1;
    }

    @Order(10.0f)
    public class OutlineTreeField extends AbstractTreeField {
      @Override
      protected boolean getConfiguredLabelVisible() {
        return false;
      }

      @Override
      protected int getConfiguredGridW() {
        return 1;
      }

      @Override
      protected int getConfiguredGridH() {
        return 20;
      }
    }
  }

  @Order(10.0f)
  public class ViewHandler extends AbstractFormHandler {
  }
}
