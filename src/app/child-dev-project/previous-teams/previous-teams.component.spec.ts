import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildrenService } from "../children/children.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildrenModule } from "../children/children.module";
import { RouterTestingModule } from "@angular/router/testing";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { SimpleChange } from "@angular/core";
import { Child } from "../children/model/child";
import { PreviousTeamsComponent } from "./previous-teams.component";
import { SessionService } from "../../core/session/session-service/session.service";
import { User } from "../../core/user/user";

describe("PreviousTeamsComponent", () => {
  let component: PreviousTeamsComponent;
  let fixture: ComponentFixture<PreviousTeamsComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  const testChild = new Child("22");

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj(["getSchoolsWithRelations"]);
      mockChildrenService.getSchoolsWithRelations.and.resolveTo([]);
      mockEntityMapper = jasmine.createSpyObj(["loadType"]);
      mockEntityMapper.loadType.and.resolveTo([]);
      TestBed.configureTestingModule({
        declarations: [PreviousTeamsComponent],
        imports: [
          RouterTestingModule,
          ChildrenModule,
          ConfirmationDialogModule,
        ],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: EntityMapperService, useValue: mockEntityMapper },
          {
            provide: SessionService,
            useValue: { getCurrentUser: () => new User() },
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviousTeamsComponent);
    component = fixture.componentInstance;
    component.child = testChild;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("it calls children service with id from passed child", (done) => {
    spyOn(component, "loadData").and.callThrough();
    mockChildrenService.getSchoolsWithRelations.and.callThrough();

    component.ngOnChanges({
      child: new SimpleChange(undefined, testChild, false),
    });

    fixture.whenStable().then(() => {
      expect(component.loadData).toHaveBeenCalledWith(testChild.getId());
      expect(mockChildrenService.getSchoolsWithRelations).toHaveBeenCalledWith(
        testChild.getId()
      );
      done();
    });
  });
});
