import { DatabaseRule, DatabaseRules } from "./permission-types";
import { migrateLegacySectionKeys } from "./permissions-config-migration";

describe("migrateLegacySectionKeys", () => {
  it("makes legacy sections available under their current key", () => {
    const legacyRules: DatabaseRules = {
      default: [{ subject: "Child", action: "read" }],
      public: [{ subject: "PublicFormConfig", action: "read" }],
    };

    const migrated = migrateLegacySectionKeys(legacyRules);

    expect(migrated._default).toEqual(legacyRules.default);
    expect(migrated._public).toEqual(legacyRules.public);
  });

  it("keeps the current key when both spellings exist", () => {
    const current: DatabaseRule[] = [{ subject: "Child", action: "read" }];
    const migrated = migrateLegacySectionKeys({
      _default: current,
      default: [{ subject: "School", action: "manage" }],
      _public: [],
      public: [{ subject: "Child", action: "create" }],
    });

    expect(migrated._default).toEqual(current);
    // an existing (even empty) current section is not overwritten
    expect(migrated._public).toEqual([]);
  });

  it("leaves role sections and the input object untouched", () => {
    const rules: DatabaseRules = {
      default: [{ subject: "Child", action: "read" }],
      user_app: [{ subject: "Note", action: "manage" }],
    };

    const migrated = migrateLegacySectionKeys(rules);

    expect(migrated.user_app).toEqual(rules.user_app);
    // the loaded entity's data must not be modified in place
    expect(rules._default).toBeUndefined();
  });

  it("passes a missing rules object through, so 'no config' stays distinguishable", () => {
    expect(migrateLegacySectionKeys(undefined)).toBeUndefined();
  });
});
