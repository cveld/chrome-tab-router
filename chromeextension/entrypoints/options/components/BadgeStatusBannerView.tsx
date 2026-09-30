import { useEffect, useRef, useState } from 'react';
import type { BadgeProblem, IBadgeStatus } from '../../../src/Shared/BadgeStatusModels';

export type BadgeTarget = 'groupcode' | 'connection';

const EXPLANATIONS: Record<BadgeProblem, { text: string; target: BadgeTarget; action: string }> = {
  groupcode: {
    text: 'No group code is set in this profile, so rules and user profiles cannot be synced and links cannot be routed to other profiles.',
    target: 'groupcode',
    action: 'Set a group code',
  },
  connection: {
    text: 'This profile is not connected to the sync service. Routing to other profiles does not work until the connection is restored; it retries automatically.',
    target: 'connection',
    action: 'Show connection',
  },
  messages: {
    text: 'The last message to the other profiles could not be sent. The badge clears once a message goes through.',
    target: 'connection',
    action: 'Show connection',
  },
};

/** How long the "Connected" confirmation stays after a connection attempt succeeds. */
export const CONNECTED_NOTICE_MS = 4000;

/**
 * True for a few seconds after the status went from connecting to healthy, so
 * the banner can confirm the outcome instead of silently disappearing.
 */
export function useJustConnected(status: IBadgeStatus): boolean {
  const [justConnected, setJustConnected] = useState(false);
  const wasConnecting = useRef(false);

  const { problem, connecting } = status;
  useEffect(() => {
    const healthy = !problem && !connecting;
    if (wasConnecting.current && healthy) {
      setJustConnected(true);
    } else if (!healthy) {
      setJustConnected(false);
    }
    wasConnecting.current = !!connecting;
  }, [problem, connecting]);

  useEffect(() => {
    if (!justConnected) {
      return;
    }
    const timer = setTimeout(() => setJustConnected(false), CONNECTED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [justConnected]);

  return justConnected;
}

/**
 * Presentational half of BadgeStatusBanner. Kept free of backgroundStores so
 * the badge-preview simulator can render it without a background port.
 */
export function BadgeStatusBannerView({
  status,
  justConnected,
  endpoint,
  onNavigate,
}: {
  status: IBadgeStatus;
  /** Show the short "Connected" confirmation (see useJustConnected). */
  justConnected?: boolean;
  /** API base url the background talks to; shown for connection and message problems. */
  endpoint?: string;
  onNavigate: (target: BadgeTarget) => void;
}) {
  if (status.connecting) {
    return (
      <div className="banner banner-info" role="status">
        <b>{status.title}</b>
        {endpoint && <div className="banner-detail">Endpoint: {endpoint}/api</div>}
      </div>
    );
  }
  if (!status.problem) {
    return justConnected ? (
      <div className="banner banner-success" role="status">
        <b>Connected to the sync service.</b>
      </div>
    ) : null;
  }
  const explanation = EXPLANATIONS[status.problem];

  return (
    <div className="banner banner-error" role="alert">
      <b>{status.title}</b>
      <div>{explanation.text}</div>
      {status.error && <div className="banner-detail">{status.error}</div>}
      {endpoint && status.problem !== 'groupcode' && (
        <div className="banner-detail">Endpoint: {endpoint}/api</div>
      )}
      <div className="banner-actions">
        <button type="button" className="btn secondary" onClick={() => onNavigate(explanation.target)}>
          {explanation.action}
        </button>
      </div>
    </div>
  );
}
