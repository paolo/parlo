/**
 * A response body made of one JSON object per line, written while the handler is still working. Events pushed
 * before the response is returned are kept and sent first.
 */
export class NdjsonStream<T> {
  private controller!: ReadableStreamDefaultController<Uint8Array>;
  private readonly body = new ReadableStream<Uint8Array>({
    start: (controller) => {
      this.controller = controller;
    },
  });
  private readonly encoder = new TextEncoder();
  private closed = false;

  push(event: T): void {
    if (this.closed) return;
    this.controller.enqueue(this.encoder.encode(`${JSON.stringify(event)}\n`));
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.controller.close();
  }

  response(init: ResponseInit = {}): Response {
    return new Response(this.body, {
      ...init,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        ...init.headers,
      },
    });
  }
}
