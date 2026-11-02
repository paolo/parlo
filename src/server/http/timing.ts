/** Times the steps of a request for the Server-Timing header, which browsers list in the Network tab. */
export class ServerTimer {
  private readonly entries: string[] = [];

  async time<T>(name: string, run: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await run();
    } finally {
      this.entries.push(
        `${name};dur=${(performance.now() - start).toFixed(1)}`,
      );
    }
  }

  header(): string {
    return this.entries.join(", ");
  }
}
