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
package org.eclipse.scout.rt.client.services.common.session.internal;

import javax.security.auth.Subject;

import org.eclipse.core.runtime.Platform;
import org.eclipse.scout.commons.annotations.Priority;
import org.eclipse.scout.commons.job.IRunnable;
import org.eclipse.scout.commons.logger.IScoutLogger;
import org.eclipse.scout.commons.logger.ScoutLogManager;
import org.eclipse.scout.rt.client.IClientSession;
import org.eclipse.scout.rt.client.job.ClientJobInput;
import org.eclipse.scout.rt.client.job.IModelJobManager;
import org.eclipse.scout.rt.client.services.common.session.IClientSessionRegistryService;
import org.eclipse.scout.rt.platform.cdi.OBJ;
import org.eclipse.scout.rt.shared.ui.UserAgent;
import org.eclipse.scout.service.AbstractService;
import org.osgi.framework.Bundle;

@Priority(-1)
public class ClientSessionRegistryService extends AbstractService implements IClientSessionRegistryService {
  private static final IScoutLogger LOG = ScoutLogManager.getLogger(ClientSessionRegistryService.class);

  @Override
  public <T extends IClientSession> T newClientSession(Class<T> clazz, Subject subject, UserAgent userAgent) {
    final Bundle bundle = getDefiningBundle(clazz);
    if (bundle == null) {
      return null;
    }
    return createAndStartClientSession(clazz, bundle, subject, userAgent);
  }

  @SuppressWarnings("unchecked")
  private <T extends IClientSession> T createAndStartClientSession(Class<T> clazz, final Bundle bundle, Subject subject, UserAgent userAgent) {
    try {
      final IClientSession clientSession = clazz.newInstance();
      clientSession.setSubject(subject);
      clientSession.setUserAgent(userAgent);
      OBJ.one(IModelJobManager.class).schedule(new IRunnable() {
        @Override
        public void run() throws Exception {
          clientSession.startSession(bundle);
        }
      }, ClientJobInput.defaults().session(clientSession).name("Session startup")).get();
      return (T) clientSession;
    }
    catch (Throwable t) {
      LOG.error("could not load session for " + bundle.getSymbolicName(), t);
      return null;
    }
  }

  private <T extends IClientSession> Bundle getDefiningBundle(Class<T> clazz) {
    String symbolicName = clazz.getPackage().getName();
    Bundle bundleLocator = null;
    while (symbolicName != null) {
      bundleLocator = Platform.getBundle(symbolicName);
      int i = symbolicName.lastIndexOf('.');
      if (bundleLocator != null || i < 0) {
        break;
      }
      symbolicName = symbolicName.substring(0, i);
    }

    return Platform.getBundle(symbolicName);
  }

}
