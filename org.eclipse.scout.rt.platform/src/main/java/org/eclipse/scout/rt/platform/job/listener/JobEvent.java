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
package org.eclipse.scout.rt.platform.job.listener;

import java.util.EventObject;

import org.eclipse.scout.commons.Assertions;
import org.eclipse.scout.commons.ToStringBuilder;
import org.eclipse.scout.rt.platform.job.IBlockingCondition;
import org.eclipse.scout.rt.platform.job.IFuture;
import org.eclipse.scout.rt.platform.job.IJobManager;

/**
 * Event that is fired upon job lifecycle events.
 *
 * @since 5.1
 */
public class JobEvent extends EventObject {

  private static final long serialVersionUID = 1L;

  private final JobEventType m_eventType;
  private final IFuture<?> m_future;
  private final IBlockingCondition m_blockingCondition;
  private final long m_nanoTime = System.nanoTime();

  public JobEvent(final IJobManager jobManager, final JobEventType type, final IFuture<?> future) {
    this(jobManager, type, future, null);
  }

  public JobEvent(final IJobManager jobManager, final JobEventType type, final IFuture<?> future, final IBlockingCondition blockingCondition) {
    super(jobManager);
    m_eventType = Assertions.assertNotNull(type);
    m_future = future;
    m_blockingCondition = blockingCondition;
  }

  @Override
  public IJobManager getSource() {
    return (IJobManager) super.getSource();
  }

  /**
   * @return type that describes the event.
   */
  public JobEventType getType() {
    return m_eventType;
  }

  /**
   * @return time of the event (ns).
   */
  public long getNanoTime() {
    return m_nanoTime;
  }

  /**
   * @return blocking condition which a 'blocking event' is associated with; is <code>null</code> for other events.
   * @see JobEventType#BLOCKED
   * @see JobEventType#UNBLOCKED
   */
  public IBlockingCondition getBlockingCondition() {
    return m_blockingCondition;
  }

  /**
   * @return Future that is associated with the event. Depending on the event, there is no Future associated with the
   *         event.
   */
  public IFuture<?> getFuture() {
    return m_future;
  }

  @Override
  public String toString() {
    final ToStringBuilder builder = new ToStringBuilder(this);
    builder.attr("type", m_eventType.name());
    builder.attr("nanoTime", m_nanoTime);
    builder.attr("future", m_future);
    builder.ref("source", getSource());
    return builder.toString();
  }
}
