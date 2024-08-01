import { ConfigurableEnumValue } from "./configurable-enum.interface";
import { ConfigurableEnum } from "./configurable-enum";

describe("ConfigurableEnum", () => {
  let sampleValues: ConfigurableEnumValue[];
  let testEnum: ConfigurableEnum;

  beforeEach(async () => {
    sampleValues = [
      { id: "1", label: "one" },
      { id: "2", label: "two" },
    ];
    testEnum = new ConfigurableEnum("test-enum");
    testEnum.values = JSON.parse(JSON.stringify(sampleValues));
  });

  it("should create", () => {
    expect(testEnum).toBeTruthy();
  });

  it("should add option from value object", () => {
    const newOption: ConfigurableEnumValue = {
      id: "3",
      label: "three",
      color: "red",
    };
    const returnedOption = testEnum.addOption(newOption);
    expect(returnedOption).toEqual(newOption);
    expect(testEnum.values).toContain(newOption);
    expect(testEnum.values.length).toBe(sampleValues.length + 1);
  });

  it("should add option from string", () => {
    const newOption: string = "three";
    const returnedOption = testEnum.addOption(newOption);
    expect(returnedOption.label).toEqual(newOption);
    expect(testEnum.values).toContain(
      jasmine.objectContaining({ id: "THREE", label: "three" }),
    );
    expect(testEnum.values.length).toBe(sampleValues.length + 1);
  });

  it("should not add option for empty values", () => {
    testEnum.addOption("");
    testEnum.addOption(undefined);
    expect(testEnum.values).toEqual(sampleValues);
  });

  it("should not add option for duplicate label", () => {
    expect(() => testEnum.addOption(sampleValues[0].label)).toThrowError();
    expect(testEnum.values).toEqual(sampleValues);
  });

  it("should adapt generated id if duplicate", () => {
    const newOption: string = "1"; // already exists as id in sampleValues (but with different label)
    const returnedOption = testEnum.addOption(newOption);

    expect(returnedOption.label).toEqual(newOption);
    expect(returnedOption.id).toEqual("1_");
    expect(testEnum.values).toContain(returnedOption);
    expect(testEnum.values.length).toBe(sampleValues.length + 1);
  });
});
