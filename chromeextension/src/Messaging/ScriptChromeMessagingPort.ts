/// <reference types="chrome"/>
import type { IMessageType } from "../Shared/MessageModels";

const ports = new Map<string, ScriptChromeMessagingWithPort>();
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000] as const;
const MAX_QUEUED_MESSAGES = 50;

type ICallback<T> = (message: IMessageType<T>, port: chrome.runtime.Port) => void;
type ICallbackAny = (message: IMessageType<any>, port: chrome.runtime.Port) => void;
type ConnectionChangeListener = (connected: boolean, error?: string) => void;

// Extension-page side of the long-lived port to the background service worker.
// MV3 note: the port drops whenever the worker is not running or restarts
// (idle termination, extension update, a worker that failed to start). This
// class reconnects with backoff, queues outgoing messages meanwhile and lets
// callers re-request their state once a new port is up.
export class ScriptChromeMessagingWithPort {
  messageHandlers = new Map<string, ICallbackAny>();

  private currentPort?: chrome.runtime.Port;
  private connectionState = false;
  private lastErrorMessage?: string;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempt = 0;
  private hasDisconnected = false;
  private readonly queuedMessages: IMessageType<any>[] = [];
  private readonly connectionChangeListeners = new Set<ConnectionChangeListener>();
  private readonly reconnectListeners = new Set<() => void>();

  static getInstance(name: string): ScriptChromeMessagingWithPort {
    if (ports.has(name)) {
      return ports.get(name)!;
    }
    const instance = new ScriptChromeMessagingWithPort(name);
    ports.set(name, instance);
    return instance;
  }

  private constructor(private readonly name: string) {
    this.createPort();
  }

  /** True once the background has sent at least one message over the current port. */
  get connected(): boolean {
    return this.connectionState;
  }

  /** The chrome.runtime.lastError (or thrown error) of the most recent disconnect. */
  get lastError(): string | undefined {
    return this.lastErrorMessage;
  }

  onConnectionChange(listener: ConnectionChangeListener): () => void {
    this.connectionChangeListeners.add(listener);
    return () => {
      this.connectionChangeListeners.delete(listener);
    };
  }

  /** Called each time a new port replaces a dropped one, e.g. to re-send get* requests. */
  onReconnect(listener: () => void): () => void {
    this.reconnectListeners.add(listener);
    return () => {
      this.reconnectListeners.delete(listener);
    };
  }

  setHandler<T>(action: string, callback: ICallback<T>) {
    this.messageHandlers.set(action, callback as ICallbackAny);
  }

  sendMessage<T>(message: IMessageType<T>): void {
    const port = this.currentPort;
    if (!port) {
      this.enqueueMessage(message);
      this.scheduleReconnect();
      return;
    }
    try {
      port.postMessage(message);
    } catch (error) {
      this.enqueueMessage(message);
      this.handlePortFailure(port, getErrorMessage(error));
    }
  }

  private createPort(): void {
    if (this.currentPort) {
      return;
    }

    let newPort: chrome.runtime.Port;
    try {
      newPort = chrome.runtime.connect({ name: this.name });
    } catch (error) {
      // e.g. "Extension context invalidated" after the extension was reloaded.
      this.hasDisconnected = true;
      this.setDisconnected(getErrorMessage(error));
      this.scheduleReconnect();
      return;
    }

    const isReconnect = this.hasDisconnected;
    this.currentPort = newPort;

    newPort.onMessage.addListener((message: IMessageType<any>, receivedPort) => {
      if (this.currentPort !== newPort) {
        return;
      }
      // connect() succeeds even when no worker listens; only an inbound
      // message proves the background is actually alive.
      if (!this.connectionState) {
        this.reconnectAttempt = 0;
        this.lastErrorMessage = undefined;
        this.setConnectionState(true);
      }
      this.messageHandlers.get(message.type)?.(message, receivedPort);
    });

    newPort.onDisconnect.addListener(() => {
      // Reading lastError here also silences "Unchecked runtime.lastError".
      const error = chrome.runtime.lastError?.message;
      if (this.currentPort !== newPort) {
        return;
      }
      this.currentPort = undefined;
      this.hasDisconnected = true;
      this.setDisconnected(error);
      this.scheduleReconnect();
    });

    this.flushQueuedMessages(newPort);

    if (isReconnect && this.currentPort === newPort) {
      for (const listener of [...this.reconnectListeners]) {
        listener();
      }
    }
  }

  private handlePortFailure(failedPort: chrome.runtime.Port, error?: string): void {
    if (this.currentPort !== failedPort) {
      return;
    }
    this.currentPort = undefined;
    this.hasDisconnected = true;
    this.setDisconnected(error);
    try {
      failedPort.disconnect();
    } catch {
      // Already invalidated.
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.currentPort || this.reconnectTimer !== undefined) {
      return;
    }
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.createPort();
    }, delay);
  }

  private enqueueMessage(message: IMessageType<any>): void {
    if (this.queuedMessages.length >= MAX_QUEUED_MESSAGES) {
      this.queuedMessages.shift();
    }
    this.queuedMessages.push(message);
  }

  private flushQueuedMessages(port: chrome.runtime.Port): void {
    while (this.currentPort === port && this.queuedMessages.length > 0) {
      const message = this.queuedMessages.shift()!;
      try {
        port.postMessage(message);
      } catch (error) {
        this.queuedMessages.unshift(message);
        this.handlePortFailure(port, getErrorMessage(error));
        return;
      }
    }
  }

  private setDisconnected(error?: string): void {
    if (error) {
      this.lastErrorMessage = error;
    }
    if (this.connectionState) {
      this.setConnectionState(false, error);
    } else if (error) {
      // Still report the error when we never got connected in the first place.
      for (const listener of [...this.connectionChangeListeners]) {
        listener(false, error);
      }
    }
  }

  private setConnectionState(connected: boolean, error?: string): void {
    if (this.connectionState === connected) {
      return;
    }
    this.connectionState = connected;
    for (const listener of [...this.connectionChangeListeners]) {
      listener(connected, connected ? undefined : error);
    }
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
