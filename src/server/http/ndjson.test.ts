import { describe, expect, it } from "vitest";
import { NdjsonStream } from "./ndjson";

describe("NdjsonStream", () => {
  it("sends events pushed before and after the response, one JSON object per line", async () => {
    const stream = new NdjsonStream<{ n: number }>();
    stream.push({ n: 1 });
    const res = stream.response({ status: 201 });
    stream.push({ n: 2 });
    stream.close();

    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toBe("application/x-ndjson");
    expect(await res.text()).toBe('{"n":1}\n{"n":2}\n');
  });

  it("ignores events pushed after it was closed", async () => {
    const stream = new NdjsonStream<string>();
    stream.push("a");
    stream.close();
    stream.push("b");
    stream.close();

    expect(await stream.response().text()).toBe('"a"\n');
  });
});
