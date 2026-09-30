import { ConnectionStatusEnum, type IConnectionStatus } from './signalrModels';
import { MessageStatusEnum, type IMessageStatus } from './MessageStatusModels';

/** Why the extension icon shows the red "!" badge; absent when all is well. */
export type BadgeProblem = 'groupcode' | 'messages' | 'connection';

export interface IBadgeStatus {
  problem?: BadgeProblem;
  /** A first connection attempt is in flight; not a problem, so no red badge. */
  connecting?: boolean;
  /** Same text as the icon's tooltip. */
  title: string;
  /** Raw error from the underlying status, if any. */
  error?: string;
}

export const okBadgeStatus: IBadgeStatus = { title: 'Chrome tab router' };

export const connectingBadgeStatus: IBadgeStatus = {
  connecting: true,
  title: 'Connecting to the sync service…',
};

/** Order matters: a missing group code explains every other failure, so it wins. */
export function computeBadgeStatus(
  connectionStatus: IConnectionStatus,
  hasGroupcode: boolean,
  messageStatus: IMessageStatus,
): IBadgeStatus {
  if (!hasGroupcode) {
    return { problem: 'groupcode', title: 'Groupcode not set' };
  }
  if (messageStatus.status === MessageStatusEnum.error) {
    return {
      problem: 'messages',
      title: `Messages error: ${messageStatus.error}`,
      error: messageStatus.error,
    };
  }
  // A first attempt (fresh group code, worker start, manual reconnect) is not
  // an error yet. A retry carries the previous error and stays a problem, so a
  // failing connection does not flicker between error and connecting.
  const { status, error } = connectionStatus;
  if ((status === ConnectionStatusEnum.init || status === ConnectionStatusEnum.connecting) && !error) {
    return connectingBadgeStatus;
  }
  if (status !== ConnectionStatusEnum.connected) {
    return {
      problem: 'connection',
      title: `Connection error: ${connectionStatus.error}`,
      error: connectionStatus.error,
    };
  }
  return okBadgeStatus;
}
