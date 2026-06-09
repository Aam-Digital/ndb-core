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
});
