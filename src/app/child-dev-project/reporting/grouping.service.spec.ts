import { TestBed } from "@angular/core/testing";

import { GroupingService } from "./grouping.service";
import { Gender } from "../children/model/Gender";
import { Child } from "../children/model/child";

describe("GroupingService", () => {
  let service: GroupingService;

  let maleChristianChild: Child;
  let femaleChristianChild: Child;
  let femaleMuslimChild: Child;
  let maleChristianChild2: Child;

  beforeEach(() => {
    maleChristianChild = new Child("maleChristianChild");
    maleChristianChild.gender = Gender.MALE;
    maleChristianChild.religion = "christian";
    femaleChristianChild = new Child("femaleChristianChild");
    femaleChristianChild.gender = Gender.FEMALE;
    femaleChristianChild.religion = "christian";
    femaleMuslimChild = new Child("femaleMuslimChild");
    femaleMuslimChild.gender = Gender.FEMALE;
    femaleMuslimChild.religion = "muslim";
    maleChristianChild2 = new Child("maleChristianChild2");
    maleChristianChild2.gender = Gender.MALE;
    maleChristianChild2.religion = "christian";
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should group children by gender", () => {
    const children = [
      femaleMuslimChild,
      maleChristianChild2,
      maleChristianChild,
      femaleChristianChild,
    ];

    const grouped = service.groupBy(children, "gender").flatten();

    expect(grouped).toHaveSize(3);
    expect(grouped).toContain({
      values: {},
      data: jasmine.arrayWithExactContents(children),
    });
    expect(grouped).toContain({
      values: { gender: Gender.MALE },
      data: jasmine.arrayWithExactContents([
        maleChristianChild2,
        maleChristianChild,
      ]),
    });
    expect(grouped).toContain({
      values: { gender: Gender.FEMALE },
      data: jasmine.arrayWithExactContents([
        femaleChristianChild,
        femaleMuslimChild,
      ]),
    });
  });

  it("should group children by gender and religion", () => {
    const children = [
      maleChristianChild,
      femaleChristianChild,
      maleChristianChild2,
      femaleMuslimChild,
    ];

    const grouped = service.groupBy(children, "gender", "religion").flatten();

    expect(grouped).toHaveSize(6);
    expect(grouped).toContain({
      values: {},
      data: jasmine.arrayWithExactContents(children),
    });
    expect(grouped).toContain({
      values: { gender: Gender.MALE },
      data: jasmine.arrayWithExactContents([
        maleChristianChild,
        maleChristianChild2,
      ]),
    });
    expect(grouped).toContain({
      values: { gender: Gender.FEMALE },
      data: jasmine.arrayWithExactContents([
        femaleMuslimChild,
        femaleChristianChild,
      ]),
    });
    expect(grouped).toContain({
      values: { gender: Gender.MALE, religion: "christian" },
      data: jasmine.arrayWithExactContents([
        maleChristianChild,
        maleChristianChild2,
      ]),
    });
    expect(grouped).toContain({
      values: { gender: Gender.FEMALE, religion: "christian" },
      data: [femaleChristianChild],
    });
    expect(grouped).toContain({
      values: { gender: Gender.FEMALE, religion: "muslim" },
      data: [femaleMuslimChild],
    });
  });
});
