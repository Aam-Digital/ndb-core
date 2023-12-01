import { DateAdapter } from "@angular/material/core";
import { DateAdapterWithFormatting } from "./date-adapter-with-formatting";
import { TestBed } from "@angular/core/testing";

describe("DateAdapterWithFormatting", () => {
  let adapter: DateAdapter<Date>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DateAdapterWithFormatting],
    });
    adapter = TestBed.inject(DateAdapterWithFormatting);
  });

  it("should parse en-US dates", () => {
    const date = adapter.parse("2022-08-09", "");
    expect(date.getDate()).toBe(9);
    expect(date.getMonth()).toBe(7);
    expect(date.getFullYear()).toBe(2022);
  });

  it("should parse de dates", () => {
    adapter.setLocale("de");
    const date = adapter.parse("9.8.2022", "l");
    expect(date.getDate()).toBe(9);
    expect(date.getMonth()).toBe(7);
    expect(date.getFullYear()).toBe(2022);
  });
});
