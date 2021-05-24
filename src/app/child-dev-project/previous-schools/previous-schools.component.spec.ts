import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { PreviousSchoolsComponent } from "./previous-schools.component";
import { ChildrenService } from "../children/children.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildrenModule } from "../children/children.module";
import { RouterTestingModule } from "@angular/router/testing";
import { ConfirmationDialogModule } from "../../core/confirmation-dialog/confirmation-dialog.module";
import { SimpleChange } from "@angular/core";
import { Child } from "../children/model/child";
import { PanelConfig } from "../../core/entity-components/entity-details/EntityDetailsConfig";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";

describe("PreviousSchoolsComponent", () => {
  let component: PreviousSchoolsComponent;
  let fixture: ComponentFixture<PreviousSchoolsComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  const testChild = new Child("22");

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj(["getSchoolsWithRelations"]);
      mockChildrenService.getSchoolsWithRelations.and.resolveTo([
        new ChildSchoolRelation(),
      ]);
      mockEntityMapper = jasmine.createSpyObj(["loadType"]);
      mockEntityMapper.loadType.and.resolveTo([]);
      TestBed.configureTestingModule({
        declarations: [PreviousSchoolsComponent],
        imports: [
          RouterTestingModule,
          ChildrenModule,
          ConfirmationDialogModule,
        ],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: EntityMapperService, useValue: mockEntityMapper },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviousSchoolsComponent);
    component = fixture.componentInstance;
    component.child = testChild;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("it calls children service with id from passed child", fakeAsync(() => {
    component.ngOnChanges({
      child: new SimpleChange(undefined, testChild, false),
    });
    tick();
    expect(mockChildrenService.getSchoolsWithRelations).toHaveBeenCalledWith(
      testChild.getId()
    );
  }));

  it("should only show columns which are defined by the config", fakeAsync(() => {
    const config: PanelConfig = {
      entity: new Child(),
      config: {
        single: true,
        columns: [
          { id: "schoolId", placeholder: "Team", input: "school" },
          { id: "start", placeholder: "From", input: "date" },
          { id: "end", placeholder: "To", input: "date" },
        ],
      },
    };
    component.onInitFromDynamicConfig(config);
    tick();
    expect(component.columns).toHaveSize(3);
    let columnNames = component.columns.map((column) => column.placeholder);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");

    config.config.columns.push({
      id: "schoolClass",
      placeholder: "Class",
      input: "text",
    });
    config.config.columns.push({
      id: "result",
      placeholder: "Result",
      input: "percentageResult",
    });

    component.onInitFromDynamicConfig(config);
    tick();
    expect(component.columns).toHaveSize(5);
    columnNames = component.columns.map((column) => column.placeholder);
    expect(columnNames).toContain("Team");
    expect(columnNames).toContain("From");
    expect(columnNames).toContain("To");
    expect(columnNames).toContain("Class");
    expect(columnNames).toContain("Result");
  }));
});
