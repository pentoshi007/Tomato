import type { Socket } from "socket.io-client";

type DemoHandler = (payload: unknown) => void;

class DemoSocket {
  private handlers = new Map<string, Set<DemoHandler>>();

  readonly id = "demo-socket";
  readonly connected = true;

  on(event: string, handler: DemoHandler) {
    const bucket = this.handlers.get(event) ?? new Set<DemoHandler>();
    bucket.add(handler);
    this.handlers.set(event, bucket);
    return this;
  }

  off(event: string, handler?: DemoHandler) {
    if (!handler) {
      this.handlers.delete(event);
      return this;
    }
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  emit() {
    return this;
  }

  dispatch(event: string, payload: unknown) {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }

  reset() {
    this.handlers.clear();
  }
}

export const demoSocket = new DemoSocket();

export const demoSocketAsClient = () => demoSocket as unknown as Socket;
