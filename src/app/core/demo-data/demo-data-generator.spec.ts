import {DemoDataGenerator} from './demo-data-generator';


class DemoDataGeneratorImplementation extends DemoDataGenerator<any> {
  protected generateEntities(): any[] {
    return [];
  }
}

describe('DemoDataGenerator', () => {

  it('should getEarlierDateOrToday', () => {
    const generator = new DemoDataGeneratorImplementation();
    const TODAY = new Date();

    const earlierDate = new Date(2019, 0, 1);
    expect(generator.getEarlierDateOrToday(earlierDate)).toEqual(earlierDate);

    const laterDate = new Date();
    laterDate.setMonth(laterDate.getMonth() + 1);
    let actualDate = generator.getEarlierDateOrToday(laterDate);
    expect(actualDate.getFullYear()).toEqual(TODAY.getFullYear());
    expect(actualDate.getMonth()).toEqual(TODAY.getMonth());
    expect(actualDate.getDate()).toEqual(TODAY.getDate());

    const noDate = undefined;
    actualDate = generator.getEarlierDateOrToday(noDate);
    expect(actualDate.getFullYear()).toEqual(TODAY.getFullYear());
    expect(actualDate.getMonth()).toEqual(TODAY.getMonth());
    expect(actualDate.getDate()).toEqual(TODAY.getDate());
  });
});
