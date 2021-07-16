import { KeysPipe } from "./keys.pipe";

describe("KeysPipe", () => {
  it("create an instance", () => {
    const pipe = new KeysPipe();
    expect(pipe).toBeTruthy();
  });

  it("should create key value pairs of an object", () => {
    const obj = { first: "First", second: "Second" };

    const res = new KeysPipe().transform(obj);

    expect(res).toEqual([
      { key: "first", value: "First" },
      { key: "second", value: "Second" },
    ]);
  });
});
