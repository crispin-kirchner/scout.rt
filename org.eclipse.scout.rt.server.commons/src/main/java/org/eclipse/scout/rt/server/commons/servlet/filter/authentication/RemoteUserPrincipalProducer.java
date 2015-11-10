/*******************************************************************************
 * Copyright (c) 2015 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.server.commons.servlet.filter.authentication;

import org.eclipse.scout.rt.server.commons.authentication.IPrincipalProducer;

/**
 * Producer for {@link RemoteUserPrincipal} objects.
 *
 * @since 5.2
 */
public class RemoteUserPrincipalProducer implements IPrincipalProducer {

  @Override
  public RemoteUserPrincipal produce(final String username) {
    return new RemoteUserPrincipal(username);
  }
}
