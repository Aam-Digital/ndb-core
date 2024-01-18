import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayParticipantsCountComponent } from "./display-participants-count.component";
import { ChildrenService } from "../../children/children.service";
import { School } from "../model/school";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";

describe("DisplayParticipantsCountComponent", () => {
  let component: DisplayParticipantsCountComponent;
  let fixture: ComponentFixture<DisplayParticipantsCountComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  const childSchoolRelations: ChildSchoolRelation[] = [
    new ChildSchoolRelation("r-1"),
    new ChildSchoolRelation("r-2"),
    new ChildSchoolRelation("r-3"),
  ];

  beforeEach(async () => {
    mockChildrenService = jasmine.createSpyObj(["queryActiveRelationsOf"]);
    mockChildrenService.queryActiveRelationsOf.and.resolveTo(
      childSchoolRelations,
    );

    await TestBed.configureTestingModule({
      imports: [DisplayParticipantsCountComponent],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayParticipantsCountComponent);
    component = fixture.componentInstance;
    component.entity = new School("s-1");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should count correct number of active students for school", async () => {
    expect(component.participantRelationsCount()).toBeNull();
    await component.ngOnChanges();
    expect(component.participantRelationsCount()).toBeDefined();
    expect(component.participantRelationsCount()).toBe(3);
  });

  it("should handle empty response from ChildrenService", async () => {
    mockChildrenService.queryActiveRelationsOf.and.resolveTo([]);
    expect(component.participantRelationsCount()).toBeNull();
    await component.ngOnChanges();
    expect(component.participantRelationsCount()).toBeDefined();
    expect(component.participantRelationsCount()).toBe(0);
  });

  it("should handle error response from ChildrenService", async () => {
    mockChildrenService.queryActiveRelationsOf.and.rejectWith(new Error());
    expect(component.participantRelationsCount()).toBeNull();
    await component.ngOnChanges();
    expect(component.participantRelationsCount()).toBeNull();
  });
});
