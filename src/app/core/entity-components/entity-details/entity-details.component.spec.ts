import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { EntityDetailsComponent } from "./entity-details.component";
import { Observable, of, Subscriber } from "rxjs";
import { MatNativeDateModule } from "@angular/material/core";
import { ActivatedRoute, Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EntityDetailsConfig, PanelConfig } from "./EntityDetailsConfig";
import { ChildrenModule } from "../../../child-dev-project/children/children.module";
import { Child } from "../../../child-dev-project/children/model/child";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { EntityPermissionsService } from "../../permissions/entity-permissions.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { MockEntityMapperService } from "../../entity/mock-entity-mapper-service";
import { MockSessionModule } from "../../session/mock-session.module";

describe("EntityDetailsComponent", () => {
  let component: EntityDetailsComponent;
  let fixture: ComponentFixture<EntityDetailsComponent>;

  let routeObserver: Subscriber<any>;

  const routeConfig: EntityDetailsConfig = {
    icon: "child",
    entity: "Child",
    panels: [
      {
        title: "One Form",
        components: [
          {
            title: "",
            component: "Form",
            config: { cols: [[]] },
          },
        ],
      },
      {
        title: "Two Components",
        components: [
          { title: "First Component", component: "PreviousSchools" },
          { title: "Second Component", component: "Aser" },
        ],
      },
    ],
  };
  const mockedRoute = {
    paramMap: new Observable((observer) => {
      routeObserver = observer;
      observer.next({ get: () => "new" });
    }),
    data: of(routeConfig),
  };

  const mockEntityPermissionsService: jasmine.SpyObj<EntityPermissionsService> = jasmine.createSpyObj(
    ["userIsPermitted"]
  );

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockedEntityMapper: MockEntityMapperService;

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj([
        "getSchoolRelationsFor",
        "getAserResultsOfChild",
      ]);
      mockChildrenService.getSchoolRelationsFor.and.resolveTo([]);
      mockChildrenService.getAserResultsOfChild.and.returnValue(of([]));
      TestBed.configureTestingModule({
        imports: [
          ChildrenModule,
          MatNativeDateModule,
          RouterTestingModule,
          MockSessionModule.withState(),
        ],
        providers: [
          { provide: ActivatedRoute, useValue: mockedRoute },
          {
            provide: EntityPermissionsService,
            useValue: mockEntityPermissionsService,
          },
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
      mockedEntityMapper = TestBed.inject(MockEntityMapperService);
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("sets the panels config with child and creating status", fakeAsync(() => {
    const testChild = new Child("Test-Child");
    mockedEntityMapper.add(testChild);
    component.creatingNew = false;
    routeObserver.next({ get: () => testChild.getId() });
    tick();

    component.panels.forEach((p) =>
      p.components.forEach((c) => {
        const panelConfig = c.config as PanelConfig;
        expect(panelConfig.entity).toEqual(testChild);
        expect(panelConfig.creatingNew).toBeFalse();
      })
    );
  }));

  it("should load the correct child on startup", fakeAsync(() => {
    const testChild = new Child("Test-Child");
    mockedEntityMapper.add(testChild);
    spyOn(mockedEntityMapper, "load").and.callThrough();

    routeObserver.next({ get: () => testChild.getId() });
    tick();

    expect(mockedEntityMapper.load).toHaveBeenCalledWith(
      Child,
      testChild.getId()
    );
    expect(component.entity).toBe(testChild);
  }));

  it("should route back when deleting is undone", fakeAsync(() => {
    const testChild = new Child("Test-Child");
    component.entity = testChild;
    const dialogRef = fixture.debugElement.injector.get(
      ConfirmationDialogService
    );
    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    const router = fixture.debugElement.injector.get(Router);
    const dialogReturn: any = { afterClosed: () => of(true) };
    spyOn(dialogRef, "openDialog").and.returnValue(dialogReturn);
    spyOn(mockedEntityMapper, "remove").and.resolveTo();
    spyOn(mockedEntityMapper, "save").and.resolveTo();
    spyOn(component, "navigateBack");
    const snackBarReturn: any = { onAction: () => of({}) };
    spyOn(snackBar, "open").and.returnValue(snackBarReturn);
    spyOn(router, "navigate");

    component.removeEntity();
    tick();

    expect(dialogRef.openDialog).toHaveBeenCalled();
    expect(mockedEntityMapper.remove).toHaveBeenCalledWith(testChild);
    expect(snackBar.open).toHaveBeenCalled();
    expect(mockedEntityMapper.save).toHaveBeenCalledWith(testChild, true);
    expect(router.navigate).toHaveBeenCalled();
  }));

  it("should call router when user is not permitted to create entities", () => {
    mockEntityPermissionsService.userIsPermitted.and.returnValue(false);
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    routeObserver.next({ get: () => "new" });
    expect(router.navigate).toHaveBeenCalled();
  });
});
