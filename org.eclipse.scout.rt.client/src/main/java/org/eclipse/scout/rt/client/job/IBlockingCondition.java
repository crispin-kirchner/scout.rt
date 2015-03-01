package org.eclipse.scout.rt.client.job;

import org.eclipse.scout.commons.Assertions.AssertionException;
import org.eclipse.scout.commons.job.JobExecutionException;

/**
 * Use this object to put the current thread (must be the model thread) into waiting mode until this condition falls. If
 * entering the waiting mode, the threads's model-mutex is released and passed to another competing and prospective
 * model-thread.<br/>
 * This condition can be used across multiple model-threads to wait for the same condition; this condition is reusable
 * upon unblocking.
 *
 * @since 5.1
 */
public interface IBlockingCondition {

  /**
   * Queries whether at least one thread is waiting for this condition to fall.
   *
   * @return <code>true</code> if there are waiting threads, <code>false</code> otherwise.
   */
  boolean hasWaitingThreads();

  /**
   * Causes the current model-thread to wait until it is {@link #unblock() unblocked} or {@link Thread#interrupt()
   * interrupted}.<br/>
   * Thereby, the model-mutex is released and passed to another competing and prospective model-thread. The current
   * thread becomes disabled for thread scheduling purposes and lies dormant until it is unblocked or interrupted.
   * <p/>
   * <strong>Precondition: The calling thread must be the model-thread.</strong> <br/>
   *
   * @throws AssertionException
   *           is thrown if the current thread is not the model-thread.
   * @throws JobExecutionException
   *           is thrown if the current thread is interrupted while waiting for the blocking condition to fall, or if
   *           the current thread fails to re-acquire the model-mutex upon {@link #unblock()}. However, the current
   *           thread is not synchronized with the model-mutex anymore and should terminate its work.</li>
   */
  void block() throws JobExecutionException;

  /**
   * Wakes up all former model-threads waiting for this condition to fall.<br/>
   * If any threads are waiting on this condition then they are all woken up. Each thread must re-acquire the
   * model-mutex before it can return from await to continue execution in the model-thread.
   * <p/>
   * <strong>The calling thread can be any thread.</strong>
   *
   * @see #block()
   */
  void unblock();
}
