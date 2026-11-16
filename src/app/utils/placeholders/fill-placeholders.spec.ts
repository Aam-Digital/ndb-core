import {
  fillPlaceholders,
  getPlaceholders,
  isSupportedPlaceholder,
} from "./fill-placeholders";

describe("fillPlaceholders", () => {
  const data = {
    d: {
      _id: "Child:1",
      name: "Asha & Co",
      age: 7,
      active: false,
      empty: null,
      birthday: new Date(2020, 0, 5),
      lastSeen: new Date("2026-03-01T10:30:00.000Z"),
      status: { id: "ENROLLED", label: "Enrolled" },
      school: { _id: "School:9", name: "Hill School" },
      tags: ["a", "b"],
      schools: [{ _id: "School:9" }, { _id: "School:10" }],
    },
    c: { user: { name: "Test User" } },
  };

  it.each([
    ["{d.name}", "Asha & Co"],
    ["{ d.name }", "Asha & Co"],
    ["{d.age}/{d.active}", "7/false"],
    ["x{d.empty}y{d.unknown}z", "xyz"],
    ["{d.unknown.deeper}", ""],
    ["{d.birthday}", "2020-01-05"],
    ["{d.lastSeen}", "2026-03-01T10:30:00.000Z"],
    ["{d.status}", "ENROLLED"],
    ["{d.status.label}", "Enrolled"],
    ["{d.school}", "School:9"],
    ["{d.school.name}", "Hill School"],
    ["{d.tags}", "a,b"],
    ["{d.schools}", "School:9,School:10"],
    ["{c.user.name}", "Test User"],
    ["{d.birthday:formatD(L)}", "{d.birthday:formatD(L)}"],
    ["{x.name} {d}", "{x.name} {d}"],
    ["no placeholders", "no placeholders"],
  ])("fills %s as %s", (template, expected) => {
    expect(fillPlaceholders(template, data)).toBe(expected);
  });

  it("applies the transform to inserted values only", () => {
    expect(
      fillPlaceholders(
        "https://x.org/?n={d.name}&id={d._id}",
        data,
        encodeURIComponent,
      ),
    ).toBe("https://x.org/?n=Asha%20%26%20Co&id=Child%3A1");
  });

  it("lists placeholders and tells which ones it can fill", () => {
    const placeholders = getPlaceholders(
      "a {d.name} b {c.user.name} c {d.date:formatD(L)}",
    );

    expect(placeholders).toEqual([
      "d.name",
      "c.user.name",
      "d.date:formatD(L)",
    ]);
    expect(placeholders.map(isSupportedPlaceholder)).toEqual([
      true,
      true,
      false,
    ]);
  });
});
