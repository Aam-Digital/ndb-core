import { TestBed } from "@angular/core/testing";

import { GroupingService } from "./grouping.service";
import { Gender } from "../children/model/Gender";
import { Child } from "../children/model/child";
import { Note } from "../notes/model/note";
import { defaultInteractionTypes } from "../../core/config/default-config/default-interaction-types";

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

    const grouping = service.groupBy(children, "gender");

    expect(grouping).toEqual({
      all: jasmine.arrayWithExactContents(children),
      subGroups: [
        {
          values: { gender: Gender.MALE },
          group: {
            all: jasmine.arrayWithExactContents([
              maleChristianChild2,
              maleChristianChild,
            ]),
          },
        },
        {
          values: { gender: Gender.FEMALE },
          group: {
            all: jasmine.arrayWithExactContents([
              maleChristianChild2,
              maleChristianChild,
            ]),
          },
        },
      ],
    });
  });

  it("should group children by gender and religion", () => {
    const children = [
      maleChristianChild,
      femaleChristianChild,
      maleChristianChild2,
      femaleMuslimChild,
    ];

    const grouping = service.groupBy(children, "gender", "religion");

    expect(grouping).toHaveSize(8);
    expect(grouping).toContain({
      values: {},
      data: jasmine.arrayWithExactContents(children),
    });
    expect(grouping).toContain({
      values: { gender: Gender.MALE },
      data: jasmine.arrayWithExactContents([
        maleChristianChild,
        maleChristianChild2,
      ]),
    });
    expect(grouping).toContain({
      values: { gender: Gender.FEMALE },
      data: jasmine.arrayWithExactContents([
        femaleMuslimChild,
        femaleChristianChild,
      ]),
    });
    expect(grouping).toContain({
      values: { religion: "christian" },
      data: jasmine.arrayWithExactContents([
        maleChristianChild,
        maleChristianChild2,
        femaleChristianChild,
      ]),
    });
    expect(grouping).toContain({
      values: { religion: "muslim" },
      data: jasmine.arrayWithExactContents([femaleMuslimChild]),
    });
    expect(grouping).toContain({
      values: { gender: Gender.MALE, religion: "christian" },
      data: jasmine.arrayWithExactContents([
        maleChristianChild,
        maleChristianChild2,
      ]),
    });
    expect(grouping).toContain({
      values: { gender: Gender.FEMALE, religion: "christian" },
      data: [femaleChristianChild],
    });
    expect(grouping).toContain({
      values: { gender: Gender.FEMALE, religion: "muslim" },
      data: [femaleMuslimChild],
    });
  });

  it("should group notes based on category", () => {
    const meetingCategory = defaultInteractionTypes.find((it) => it.isMeeting);
    const visitCategory = defaultInteractionTypes.find(
      (it) => it.id === "VISIT"
    );
    const meetingNote = new Note("meetingNote");
    meetingNote.category = meetingCategory;
    const visitNote1 = new Note("visitNote1");
    visitNote1.category = visitCategory;
    const visitNote2 = new Note("visitNote2");
    visitNote2.category = visitCategory;
    const noteWithoutCategory = new Note("noteWithoutCategory");
    const notes = [visitNote1, meetingNote, noteWithoutCategory, visitNote2];

    const grouping = service.groupBy(notes, "category");

    expect(grouping).toHaveSize(4);
    expect(grouping).toContain({
      values: {},
      data: notes,
    });
    expect(grouping).toContain({
      values: { category: noteWithoutCategory.category }, // a default (empty) category is automatically set
      data: [noteWithoutCategory],
    });
    expect(grouping).toContain({
      values: { category: meetingCategory },
      data: [meetingNote],
    });
    expect(grouping).toContain({
      values: { category: visitCategory },
      data: jasmine.arrayWithExactContents([visitNote1, visitNote2]),
    });
  });
});
