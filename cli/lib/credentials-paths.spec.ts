import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, relative } from "path";
import { isSameFile } from "./credentials";

// Uses the real filesystem on purpose: the point of isSameFile is resolving
// symlinks, which a mocked fs would not exercise.
describe("isSameFile", () => {
  let dir: string;
  let file: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ndb-cli-paths-"));
    file = join(dir, "credentials.json");
    writeFileSync(file, "{}");
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("recognises the identical path", () => {
    expect(isSameFile(file, file)).toBe(true);
  });

  it("recognises a relative path pointing at the same file", () => {
    expect(isSameFile(relative(process.cwd(), file), file)).toBe(true);
  });

  it("resolves a symlink to its target", () => {
    const link = join(dir, "link.json");
    symlinkSync(file, link);

    expect(isSameFile(link, file)).toBe(true);
  });

  it("distinguishes two different files", () => {
    const other = join(dir, "other.json");
    writeFileSync(other, "{}");

    expect(isSameFile(file, other)).toBe(false);
  });

  it("permits the normal plaintext-into-encrypted merge", () => {
    // The guard must not be so eager that it blocks the everyday workflow of
    // merging a copied-in credentials.json into credentials.json.age.
    const encrypted = join(dir, "credentials.json.age");
    writeFileSync(encrypted, "age-ciphertext");

    expect(isSameFile(file, encrypted)).toBe(false);
  });

  it("compares non-existent paths without throwing", () => {
    const missing = join(dir, "not-there.json");

    // the merge target legitimately does not exist yet on a first run
    expect(isSameFile(missing, missing)).toBe(true);
    expect(isSameFile(missing, file)).toBe(false);
  });

  it("matches a non-existent target against an equivalent relative path", () => {
    const missing = join(dir, "nested", "..", "not-there.json");

    expect(isSameFile(missing, join(dir, "not-there.json"))).toBe(true);
  });
});
