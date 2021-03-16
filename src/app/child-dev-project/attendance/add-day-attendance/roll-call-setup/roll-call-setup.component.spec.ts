import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from "@angular/core/testing";

import { RollCallSetupComponent } from "./roll-call-setup.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { User } from "../../../../core/user/user";
import { RecurringActivity } from "../../model/recurring-activity";
import { Note } from "../../../notes/model/note";
import { ChildrenService } from "../../../children/children.service";
import { AttendanceModule } from "../../attendance.module";
import { MockDatabase } from "../../../../core/database/mock-database";
import { Database } from "../../../../core/database/database";
import { MatNativeDateModule } from "@angular/material/core";

describe("RollCallSetupComponent", () => {
  let component: RollCallSetupComponent;
  let fixture: ComponentFixture<RollCallSetupComponent>;

  let mockEntityService: jasmine.SpyObj<EntityMapperService>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(() => {
    mockEntityService = jasmine.createSpyObj("mockEntityService", [
      "save",
      "loadType",
    ]);
    mockEntityService.loadType.and.resolveTo([]);

    mockChildrenService = jasmine.createSpyObj(["queryRelationsOf"]);
    mockChildrenService.queryRelationsOf.and.resolveTo([]);

    TestBed.configureTestingModule({
      declarations: [RollCallSetupComponent],
      imports: [AttendanceModule, MatNativeDateModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityService },
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User("") },
        },
        { provide: Database, useClass: MockDatabase },
        { provide: ChildrenService, useValue: mockChildrenService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RollCallSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("generates a filled event Note from the RecurringActivity", fakeAsync(() => {
    const testActivities = [
      RecurringActivity.create("act 1"),
      RecurringActivity.create("act 2"),
    ];
    const testInteractionType = { id: "interaction1", label: "Interaction" };
    testActivities[0].type = testInteractionType;

    mockEntityService.loadType.and.resolveTo(testActivities);
    component.ngOnInit();
    flush();

    expect(component.existingEvents.length).toBe(2);
    expect(component.existingEvents[0]).toEqual(
      jasmine.objectContaining({
        category: testInteractionType,
        subject: "act 1",
      } as Partial<Note>)
    );
  }));
});
