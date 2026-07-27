import assert from "node:assert/strict";
import test from "node:test";

import { parseSmitheryYaml } from "../dist/lib/parsers.js";

test("detects supported Smithery transport hints", () => {
  const cases = [
    ["transport: streamable-http", "streamableHttp"],
    ["transport: streamable_http", "streamableHttp"],
    ["transport streamablehttp", "streamableHttp"],
    ["transport: sse", "sse"],
    ["transport:\tstdio", "stdio"],
  ];

  for (const [input, expected] of cases) {
    const result = parseSmitheryYaml(input);
    assert.equal(result.ok, true);
    assert.equal(result.data.transportType, expected);
  }
});

test("ignores unrelated transport text", () => {
  const result = parseSmitheryYaml("transportation: stdio");

  assert.equal(result.ok, true);
  assert.equal(result.data.transportType, undefined);
});

test("handles repeated uncontrolled transport keys in linear scans", () => {
  const result = parseSmitheryYaml("transport\t".repeat(40_000));

  assert.equal(result.ok, true);
  assert.equal(result.data.transportType, undefined);
});
