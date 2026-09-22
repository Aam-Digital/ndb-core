import { entityIdsMatch } from "./user-account-action-guard.service";

describe("entityIdsMatch", () => {
  it.each([
    ["identical prefixed ids", "User:abc", "User:abc", true],
    ["identical unprefixed ids", "abc", "abc", true],
    ["one prefixed, other not, same trailing id", "User:abc", "abc", true],
    [
      "unprefixed first, prefixed second, same trailing id",
      "abc",
      "User:abc",
      true,
    ],
    [
      "both prefixed but with different types or ids",
      "User:abc",
      "Child:abc",
      false,
    ],
    ["unrelated ids", "abc", "xyz", false],
    ["missing first id", undefined, "User:abc", false],
    ["missing second id", "User:abc", undefined, false],
    ["both missing", undefined, undefined, true],
  ])("%s", (_case, a, b, expected) => {
    expect(entityIdsMatch(a, b)).toBe(expected);
  });
});
