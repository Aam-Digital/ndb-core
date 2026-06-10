import { describe, expect, it, vi } from "vitest";

import { Couchdb } from "./couchdb-client";
import { OrgRunner, runForAllOrgs } from "./org-runner";

describe("runForAllOrgs", () => {
  it("runs callback for each org and collects results", async () => {
    const creds = [
      { url: "a.example.com", password: "pw1", name: "a", category: "" },
      { url: "b.example.com", password: "pw2", name: "b", category: "" },
    ];
    const callback = vi.fn().mockResolvedValue("ok");

    const results = await runForAllOrgs(creds, callback);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(results).toEqual({ "a.example.com": "ok", "b.example.com": "ok" });
  });

  it("isolates errors per org and continues", async () => {
    const creds = [
      { url: "ok.example.com", password: "pw1", name: "ok", category: "" },
      { url: "fail.example.com", password: "pw2", name: "fail", category: "" },
    ];
    const callback = vi
      .fn()
      .mockResolvedValueOnce("ok")
      .mockRejectedValueOnce(new Error("network down"));

    const results = await runForAllOrgs(creds, callback);

    expect(results["ok.example.com"]).toBe("ok");
    expect(results["fail.example.com"]).toMatch(/ERROR/);
  });
});

describe("OrgRunner.checkConnectivity", () => {
  it("classifies 401/403 errors as auth failures", async () => {
    vi.spyOn(Couchdb.prototype, "get").mockRejectedValueOnce({ status: 401 });
    const runner = new OrgRunner();
    const [result] = await runner.checkConnectivity([
      { url: "auth.example.com", password: "pw", category: "" },
    ]);

    expect(result.reachable).toBe(false);
    expect(result.failureReason).toBe("auth");
  });

  it("classifies non-auth errors as network failures", async () => {
    vi.spyOn(Couchdb.prototype, "get").mockRejectedValueOnce(
      new Error("network down"),
    );
    const runner = new OrgRunner();
    const [result] = await runner.checkConnectivity([
      { url: "net.example.com", password: "pw", category: "" },
    ]);

    expect(result.reachable).toBe(false);
    expect(result.failureReason).toBe("network");
  });
});
