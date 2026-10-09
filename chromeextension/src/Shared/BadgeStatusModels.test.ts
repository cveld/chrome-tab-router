import { describe, expect, it } from 'vitest';
import { computeBadgeStatus } from './BadgeStatusModels';
import { ConnectionStatusEnum } from './signalrModels';
import { MessageStatusEnum } from './MessageStatusModels';

const connected = { status: ConnectionStatusEnum.connected };
const messagesOk = { status: MessageStatusEnum.success };

describe('computeBadgeStatus', () => {
  it('reports no problem when connected with a group code', () => {
    expect(computeBadgeStatus(connected, true, messagesOk).problem).toBeUndefined();
  });

  it('prefers a missing group code over other failures', () => {
    const status = computeBadgeStatus(
      { status: ConnectionStatusEnum.error, error: 'boom' },
      false,
      { status: MessageStatusEnum.error, error: 'fail' },
    );
    expect(status.problem).toBe('groupcode');
  });

  it('reports a message error before a connection error', () => {
    const status = computeBadgeStatus(
      { status: ConnectionStatusEnum.disconnected, error: 'Disconnected' },
      true,
      { status: MessageStatusEnum.error, error: 'Cannot send message' },
    );
    expect(status).toMatchObject({ problem: 'messages', error: 'Cannot send message' });
  });

  it('reports a connection that is not connected', () => {
    const status = computeBadgeStatus(
      { status: ConnectionStatusEnum.disconnected, error: 'Disconnected' },
      true,
      messagesOk,
    );
    expect(status).toMatchObject({ problem: 'connection', title: 'Connection error: Disconnected' });
  });

  it('treats a first connection attempt as connecting, not as an error', () => {
    for (const status of [ConnectionStatusEnum.init, ConnectionStatusEnum.connecting]) {
      const badge = computeBadgeStatus({ status }, true, messagesOk);
      expect(badge.problem).toBeUndefined();
      expect(badge.connecting).toBe(true);
    }
  });

  it('keeps reporting the failure while a retry is connecting', () => {
    const status = computeBadgeStatus(
      { status: ConnectionStatusEnum.connecting, error: 'Failed to negotiate' },
      true,
      messagesOk,
    );
    expect(status).toMatchObject({ problem: 'connection', error: 'Failed to negotiate' });
  });

  it('asks for a pairing code, not a group code, when the local relay is selected', () => {
    const status = computeBadgeStatus({ status: ConnectionStatusEnum.error, error: 'boom' }, false, messagesOk, 'local');
    expect(status).toMatchObject({ problem: 'pairing', title: 'Sync not configured' });
  });

  it('judges a paired local relay by its connection like the cloud', () => {
    expect(computeBadgeStatus(connected, true, messagesOk, 'local').problem).toBeUndefined();
    expect(
      computeBadgeStatus({ status: ConnectionStatusEnum.error, error: 'unreachable' }, true, messagesOk, 'local'),
    ).toMatchObject({ problem: 'connection' });
  });

  it('stays neutral until the user has chosen a backend', () => {
    for (const backend of ['cloud', 'local'] as const) {
      const status = computeBadgeStatus({ status: ConnectionStatusEnum.init }, false, messagesOk, backend, false);
      expect(status).toMatchObject({ problem: 'setup', title: 'Sync not configured' });
    }
  });

  it('does not call a working default unconfigured', () => {
    expect(computeBadgeStatus(connected, true, messagesOk, 'cloud', false).problem).toBeUndefined();
  });
});
