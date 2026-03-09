import {
  datepickerFormat,
  defaultDateFormat,
  setGlobalDateFormat,
} from "./date.static";

describe("setGlobalDateFormat", () => {
  let originalFormat: string;

  beforeEach(() => {
    originalFormat = defaultDateFormat();
  });

  afterEach(() => {
    setGlobalDateFormat(originalFormat);
  });

  it("should update defaultDateFormat signal", () => {
    setGlobalDateFormat("MM/dd/yyyy");
    expect(defaultDateFormat()).toBe("MM/dd/yyyy");
  });

  it("should update datepickerFormat signal to Moment.js equivalent", () => {
    setGlobalDateFormat("MM/dd/yyyy");
    expect(datepickerFormat()).toBe("MM/DD/YYYY");
  });

  it("should not update signals when called with empty string", () => {
    setGlobalDateFormat("MM/dd/yyyy");
    setGlobalDateFormat("");
    expect(defaultDateFormat()).toBe("MM/dd/yyyy");
  });
});
