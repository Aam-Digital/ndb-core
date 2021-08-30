import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { ChildrenOverviewComponent } from "./children-overview.component";
import { SchoolsModule } from "../schools.module";
import { School } from "../model/school";
import { Child } from "../../children/model/child";
import { SchoolsService } from "../schools.service";
import { RouterTestingModule } from "@angular/router/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { MockSessionModule } from "../../../core/session/mock-session.module";
import { MatDialog } from "@angular/material/dialog";
import { EntityFormComponent } from "../../../core/entity-components/entity-form/entity-form/entity-form.component";
import { EntityFormService } from "../../../core/entity-components/entity-form/entity-form.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { EventEmitter } from "@angular/core";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";

describe("ChildrenOverviewComponent", () => {
  let component: ChildrenOverviewComponent;
  let fixture: ComponentFixture<ChildrenOverviewComponent>;
  let mockSchoolsService: jasmine.SpyObj<SchoolsService>;

  beforeEach(
    waitForAsync(() => {
      mockSchoolsService = jasmine.createSpyObj(["getChildrenForSchool"]);

      TestBed.configureTestingModule({
        declarations: [],
        imports: [
          SchoolsModule,
          RouterTestingModule,
          NoopAnimationsModule,
          MockSessionModule.withState(),
        ],
        providers: [{ provide: SchoolsService, useValue: mockSchoolsService }],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the children for a school", fakeAsync(() => {
    const school = new School("s1");
    const child1 = new Child("c1");
    const child2 = new Child("c2");
    const config = { entity: school };
    mockSchoolsService.getChildrenForSchool.and.resolveTo([child1, child2]);

    component.onInitFromDynamicConfig(config);

    expect(mockSchoolsService.getChildrenForSchool).toHaveBeenCalledWith(
      school.getId()
    );
    tick();
    expect(component.children).toEqual([child1, child2]);
  }));

  it("should route to a child when clicked", () => {
    const router = TestBed.inject(Router);
    spyOn(router, "navigate");
    const child = new Child();

    component.routeToChild(child);

    expect(router.navigate).toHaveBeenCalledWith([
      `/${Child.ENTITY_TYPE.toLowerCase()}`,
      child.getId(),
    ]);
  });

  it("should open a dialog when clicking add new child with correct relation", () => {
    component.entity = new School();
    const dialog = TestBed.inject(MatDialog);
    const entityFormService = TestBed.inject(EntityFormService);
    const alertService = TestBed.inject(AlertService);
    const dialogComponent = new EntityFormComponent(
      entityFormService,
      alertService
    );
    spyOn(dialog, "open").and.returnValues({
      componentInstance: dialogComponent,
    } as any);

    component.addChildClick();

    expect(dialog.open).toHaveBeenCalled();
    const relation = dialogComponent.entity as ChildSchoolRelation;
    expect(relation.schoolId).toBe(component.entity.getId());
  });

  it("should add a newly added child to the list", fakeAsync(() => {
    component.entity = new School();
    const child = new Child();
    const dialog = TestBed.inject(MatDialog);
    const dialogComponent = {
      onSave: new EventEmitter(),
      onCancel: new EventEmitter(),
    };
    spyOn(dialog, "open").and.returnValues({
      componentInstance: dialogComponent,
      close: () => {},
    } as any);
    mockSchoolsService.getChildrenForSchool.and.resolveTo([child]);

    component.addChildClick();
    dialogComponent.onSave.emit(undefined);
    tick();

    expect(component.children).toContain(child);
  }));

  it("should close the dialog when cancel is clicked", fakeAsync(() => {
    component.entity = new School();
    const dialog = TestBed.inject(MatDialog);
    const dialogComponent = {
      onSave: new EventEmitter(),
      onCancel: new EventEmitter(),
    };
    const closeSpy = jasmine.createSpy();
    spyOn(dialog, "open").and.returnValues({
      componentInstance: dialogComponent,
      close: closeSpy,
    } as any);

    component.addChildClick();
    dialogComponent.onCancel.emit(undefined);
    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));

  it("should assign the popup columns from the config", fakeAsync(() => {
    const dialog = TestBed.inject(MatDialog);
    const dialogComponent = {
      columns: [],
      onSave: new EventEmitter(),
      onCancel: new EventEmitter(),
    };
    spyOn(dialog, "open").and.returnValues({
      componentInstance: dialogComponent,
      close: () => {},
    } as any);
    const popupColumns = ["start", "end", "class"];
    const config: PanelConfig = {
      entity: new Child(),
      config: { popupColumns: popupColumns },
    };

    component.onInitFromDynamicConfig(config);
    tick();
    component.addChildClick();
    tick();

    expect(dialogComponent.columns).toEqual(popupColumns.map((col) => [col]));
  }));
});
