import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { decideMergeTarget } from "./credentials";

// Uses the real filesystem, like credentials-paths.spec.ts, since the
// decision depends on isSameFile's symlink/relative-path resolution.
describe("decideMergeTarget", () => {
  let dir: string;
  let plaintext: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ndb-cli-merge-target-"));
    plaintext = join(dir, "credentials.json");
    writeFileSync(plaintext, "{}");
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("switches to encrypt mode when the source is the resolved default target", () => {
    // e.g. `credentials merge cli/credentials.json` with no `.age` file yet
    // and no explicit --credentials — the everyday accidental-self-merge case.
    const decision = decideMergeTarget(plaintext, undefined, plaintext);

    expect(decision).toEqual({
      mode: "encrypt",
      path: `${plaintext}.age`,
    });
  });

  it("stays a merge into a different default target", () => {
    const encrypted = join(dir, "credentials.json.age");

    const decision = decideMergeTarget(plaintext, undefined, encrypted);

    expect(decision).toEqual({ mode: "merge", path: encrypted });
  });

  it("keeps the hard-error self-merge case when --credentials is explicit", () => {
    // An explicit --credentials pointing at the source is still nonsensical,
    // not an implicit bootstrap request — resolveSourceAndTarget rejects it.
    const decision = decideMergeTarget(plaintext, plaintext, plaintext);

    expect(decision).toEqual({ mode: "merge", path: plaintext });
  });

  it("does not treat an already-encrypted self-merge as an encrypt request", () => {
    const encrypted = join(dir, "already.json.age");
    writeFileSync(encrypted, "age-ciphertext");

    const decision = decideMergeTarget(encrypted, undefined, encrypted);

    expect(decision).toEqual({ mode: "merge", path: encrypted });
  });

  it("passes through an explicit --credentials target untouched", () => {
    const other = join(dir, "other.json.age");

    const decision = decideMergeTarget(plaintext, other, "irrelevant-default");

    expect(decision).toEqual({ mode: "merge", path: other });
  });
});
