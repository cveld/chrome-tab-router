export const enum ConnectionStatusEnum {
    undefined,
    connected = 'connected',
    disconnected = 'disconnected',
    error = 'error',
    init = 'init'
  }
export interface IConnectionStatus {
    status: ConnectionStatusEnum,
    error?: string,
    connectionId?: string | null
};
  