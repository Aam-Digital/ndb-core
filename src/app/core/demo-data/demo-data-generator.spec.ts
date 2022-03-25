import { DemoDataGenerator } from "./demo-data-generator";
import { faker } from "./faker";

describe("DemoDataGenerator", () => {
  it("should getEarlierDateOrToday", () => {
    const TODAY = new Date();

    const earlierDate = new Date(2019, 0, 1);
    expect(faker.getEarlierDateOrToday(earlierDate)).toEqual(earlierDate);

    const laterDate = new Date();
    laterDate.setMonth(laterDate.getMonth() + 1);
    let actualDate = faker.getEarlierDateOrToday(laterDate);
    expect(actualDate.getFullYear()).toEqual(TODAY.getFullYear());
    expect(actualDate.getMonth()).toEqual(TODAY.getMonth());
    expect(actualDate.getDate()).toEqual(TODAY.getDate());

    const noDate = undefined;
    actualDate = faker.getEarlierDateOrToday(noDate);
    expect(actualDate.getFullYear()).toEqual(TODAY.getFullYear());
    expect(actualDate.getMonth()).toEqual(TODAY.getMonth());
    expect(actualDate.getDate()).toEqual(TODAY.getDate());
  });
});
