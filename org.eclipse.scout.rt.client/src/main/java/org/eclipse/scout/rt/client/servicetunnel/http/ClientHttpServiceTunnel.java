/*******************************************************************************
 * Copyright (c) 2013 BSI Business Systems Integration AG.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     BSI Business Systems Integration AG - initial API and implementation
 ******************************************************************************/
package org.eclipse.scout.rt.client.servicetunnel.http;

import java.io.IOException;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLConnection;

import org.eclipse.scout.commons.exception.ProcessingException;
import org.eclipse.scout.rt.client.IClientSession;
import org.eclipse.scout.rt.client.servicetunnel.http.internal.InternalClientHttpServiceTunnel;
import org.eclipse.scout.rt.shared.servicetunnel.DefaultServiceTunnelContentHandler;
import org.eclipse.scout.rt.shared.servicetunnel.IServiceTunnelContentHandler;
import org.eclipse.scout.rt.shared.servicetunnel.IServiceTunnelRequest;
import org.eclipse.scout.rt.shared.servicetunnel.IServiceTunnelResponse;

/**
 * Client-side tunnel used to invoke a service through HTTP. This class re-defines methods of it's super class
 * since the internal class does not belong to the public API.
 *
 * @author awe (refactoring)
 */
public class ClientHttpServiceTunnel extends InternalClientHttpServiceTunnel {

  public ClientHttpServiceTunnel(IClientSession session, URL url) {
    super(session, url);
  }

  /**
   * @param url
   * @param version
   *          the version that is sent down to the server with every request.
   *          This allows the server to check client request and refuse old
   *          clients. Check the servers HttpProxyHandlerServlet init-parameter
   *          (example: min-version="0.0.0") If the version parameter is null,
   *          the product bundle (for example com.myapp.ui.swing) version is
   *          used
   */
  public ClientHttpServiceTunnel(IClientSession session, URL url, String version) {
    super(session, url, version);
  }

  @Override
  public void setAnalyzeNetworkLatency(boolean b) {
    super.setAnalyzeNetworkLatency(b);
  }

  @Override
  public void setClientNotificationPollInterval(long intervallMillis) {
    super.setClientNotificationPollInterval(intervallMillis);
  }

  /**
   * @param call
   *          the original call
   * @param callData
   *          the data created by the {@link IServiceTunnelContentHandler} used
   *          by this tunnel Create url connection and write post data (if
   *          required)
   * @throws IOException
   *           override this method to customize the creation of the {@link URLConnection} see
   *           {@link #addCustomHeaders(URLConnection, String)}
   */
  @Override
  protected URLConnection createURLConnection(IServiceTunnelRequest call, byte[] callData) throws IOException {
    return super.createURLConnection(call, callData);
  }

  /**
   * Signals the server to cancel processing jobs for the current session.
   *
   * @return true if cancel was successful and transaction was in fact cancelled, false otherwise
   */
  @Override
  protected boolean sendCancelRequest(long requestSequence) {
    return super.sendCancelRequest(requestSequence);
  }

  /**
   * @param method
   *          GET or POST override this method to add custom HTTP headers
   */
  @Override
  protected void addCustomHeaders(URLConnection urlConn, String method) throws IOException {
    super.addCustomHeaders(urlConn, method);
  }

  /**
   * @return msgEncoder used to encode and decode a request / response to and
   *         from the binary stream. Default is the {@link DefaultServiceTunnelContentHandler} which handles soap style
   *         messages
   */
  @Override
  public IServiceTunnelContentHandler getContentHandler() {
    return super.getContentHandler();
  }

  /**
   * @param msgEncoder
   *          that can encode and decode a request / response to and from the
   *          binary stream. Default is the {@link DefaultServiceTunnelContentHandler} which handles soap
   *          style messages
   */
  @Override
  public void setContentHandler(IServiceTunnelContentHandler e) {
    super.setContentHandler(e);
  }

  @Override
  public Object invokeService(Class serviceInterfaceClass, Method operation, Object[] callerArgs) throws ProcessingException {
    return super.invokeService(serviceInterfaceClass, operation, callerArgs);
  }

  @Override
  protected IServiceTunnelResponse tunnel(IServiceTunnelRequest call) {
    return super.tunnel(call);
  }

  @Override
  protected IServiceTunnelResponse tunnelOnline(final IServiceTunnelRequest call) {
    return super.tunnelOnline(call);
  }

  @Override
  protected IServiceTunnelResponse tunnelOffline(IServiceTunnelRequest call) {
    return super.tunnelOffline(call);
  }

  /**
   * This method is called just after the http response is received but before
   * the http response is processed by scout. This might be used to read and
   * interpret custom http headers.
   *
   * @since 06.07.2009
   */
  @Override
  protected void preprocessHttpRepsonse(URLConnection urlConn, IServiceTunnelRequest call, int httpCode) {
    super.preprocessHttpRepsonse(urlConn, call, httpCode);
  }

}
