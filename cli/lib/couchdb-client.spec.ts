import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe("Couchdb", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET succeeds on first attempt", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("demo.example.com", "pw");
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ rows: [{ id: "1" }] }));

    const result = await db.get("/app/_design/x");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "1" }]);
  });

  it("GET falls back to /db path when /db/couchdb returns error", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("demo.example.com", "pw");
    // First call (with /couchdb prefix) fails
    mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 500));
    // Second call (without /couchdb) succeeds
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ _id: "doc1" }));

    const result = await db.get("/app/doc1");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, secondUrl] = mockFetch.mock.calls[1];
    // second call uses the plain /db path (without couchdb prefix)
    expect(mockFetch.mock.calls[1][0] as string).not.toContain("/couchdb");
    expect(result).toEqual({ _id: "doc1" });
  });

  it("getAll adds colon suffix to prefix when missing and returns docs", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("demo.example.com", "pw");
    const rows = [{ doc: { _id: "Child:1" } }, { doc: { _id: "Child:2" } }];
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ rows }));

    const result = await db.getAll("Child");

    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.startkey).toBe("Child:");
    expect(body.endkey).toBe("Child:￰");
    expect(result).toEqual([{ _id: "Child:1" }, { _id: "Child:2" }]);
  });

  it("GET throws with status and response.status when both paths return errors", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("x.example.com", "pw");
    mockFetch.mockResolvedValue(makeJsonResponse({ error: "not_found" }, 404));

    await expect(db.get("/app/Missing")).rejects.toMatchObject({
      status: 404,
      response: { status: 404 },
    });
  });

  it("PUT throws with status and response.status on error response", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("x.example.com", "pw");
    mockFetch.mockResolvedValue(makeJsonResponse({ error: "conflict" }, 409));

    await expect(db.put("/app/Doc:1", { _id: "Doc:1" })).rejects.toMatchObject({
      status: 409,
      response: { status: 409 },
    });
  });

  it("PUT retries alternate path only for endpoint status (404/405)", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("x.example.com", "pw");
    mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 404));
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ ok: true }, 201));

    await db.put("/app/Doc:1", { _id: "Doc:1" });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain("/db/couchdb/");
    expect(mockFetch.mock.calls[1][0]).toContain("/db/app/Doc:1");
  });

  it("PUT does not retry alternate path for non-endpoint errors", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("x.example.com", "pw");
    mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 500));

    await expect(db.put("/app/Doc:1", { _id: "Doc:1" })).rejects.toMatchObject({
      status: 500,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("PUT forwards extra headers when provided", async () => {
    const { Couchdb } = await import("./couchdb-client");
    const db = new Couchdb("x.example.com", "pw");
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ ok: true }, 201));

    await db.put("/app/Doc:1", { _id: "Doc:1" }, undefined, {
      "If-Match": "3-a",
    });

    const opts = mockFetch.mock.calls[0][1] as RequestInit;
    expect((opts.headers as Record<string, string>)["If-Match"]).toBe("3-a");
  });

  describe("putAttachment", () => {
    it("PUTs the raw buffer with the given content-type, no JSON encoding", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(
        makeJsonResponse({ ok: true, id: "Child:1", rev: "2-abc" }, 201),
      );
      const buffer = Buffer.from("file bytes");

      const result = await db.putAttachment(
        "Child:1/dateienAusFreinet1?rev=1-xyz",
        buffer,
        "application/pdf",
      );

      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain(
        "/db/couchdb/app-attachments/Child:1/dateienAusFreinet1?rev=1-xyz",
      );
      expect(opts.body).toBe(buffer);
      expect((opts.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/pdf",
      );
      expect(result).toEqual({ ok: true, id: "Child:1", rev: "2-abc" });
    });

    it("falls back to the alt path on 404/405", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 404));
      mockFetch.mockResolvedValueOnce(makeJsonResponse({ ok: true }, 201));

      await db.putAttachment(
        "Child:1/f1?rev=1-a",
        Buffer.from("x"),
        "text/plain",
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0] as string).not.toContain("/couchdb");
    });

    it("does not retry and throws on a non-endpoint error (e.g. 409 conflict)", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(
        makeJsonResponse({ error: "conflict" }, 409),
      );

      await expect(
        db.putAttachment(
          "Child:1/f1?rev=stale",
          Buffer.from("x"),
          "text/plain",
        ),
      ).rejects.toMatchObject({ status: 409 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("databaseExists", () => {
    it("returns true on 200", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(
        makeJsonResponse({ db_name: "app-attachments" }),
      );

      await expect(db.databaseExists("app-attachments")).resolves.toBe(true);
    });

    it("returns false on 404", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValue(
        makeJsonResponse({ error: "not_found" }, 404),
      );

      await expect(db.databaseExists("app-attachments")).resolves.toBe(false);
    });

    it("falls back to the alt path before concluding", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 404));
      mockFetch.mockResolvedValueOnce(
        makeJsonResponse({ db_name: "app-attachments" }),
      );

      await expect(db.databaseExists("app-attachments")).resolves.toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws on a genuine error (e.g. 403)", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValue(
        makeJsonResponse({ error: "forbidden" }, 403),
      );

      await expect(db.databaseExists("app-attachments")).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  describe("createDatabase", () => {
    it("resolves on 201 created", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(makeJsonResponse({ ok: true }, 201));

      await expect(
        db.createDatabase("app-attachments"),
      ).resolves.toBeUndefined();
    });

    it("treats 412 (already exists) as success, not an error", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(
        makeJsonResponse({ error: "file_exists" }, 412),
      );

      await expect(
        db.createDatabase("app-attachments"),
      ).resolves.toBeUndefined();
    });

    it("falls back to the alt path on 404/405", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValueOnce(makeJsonResponse({}, 404));
      mockFetch.mockResolvedValueOnce(makeJsonResponse({ ok: true }, 201));

      await db.createDatabase("app-attachments");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0] as string).not.toContain("/couchdb");
    });

    it("throws on a genuine error (e.g. 500)", async () => {
      const { Couchdb } = await import("./couchdb-client");
      const db = new Couchdb("x.example.com", "pw");
      mockFetch.mockResolvedValue(
        makeJsonResponse({ error: "server_error" }, 500),
      );

      await expect(db.createDatabase("app-attachments")).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
