import { passwordEqualsEncrypted, encryptPassword } from "./local-user";

describe("LocalUser", () => {
  it("should match a password with its hash", () => {
    const password = "TestPassword123-";
    const encryptedPassword = encryptPassword(password);

    expect(passwordEqualsEncrypted(password, encryptedPassword)).toBeTrue();
  });
});
