import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { EntityDetailsComponent } from "./entity-details.component";
import { Observable, of, Subscriber } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { EntityDetailsConfig, PanelConfig } from "./EntityDetailsConfig";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../entity/entity-remove.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityMapperService } from "../../entity/entity-mapper.service";

describe("EntityDetailsComponent", () => {
  let component: EntityDetailsComponent;
  let fixture: ComponentFixture<EntityDetailsComponent>;

  let routeObserver: Subscriber<any>;

  const routeConfig: EntityDetailsConfig = {
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
    data: of({ config: routeConfig }),
    snapshot: {
      queryParamMap: {
        get: () => "",
      },
    },
  };

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;
  let mockEntityRemoveService: jasmine.SpyObj<EntityRemoveService>;
  let mockAbility: jasmine.SpyObj<EntityAbility>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj([
      "queryRelationsOf",
      "getAserResultsOfChild",
    ]);
    mockEntityRemoveService = jasmine.createSpyObj(["remove"]);
    mockChildrenService.queryRelationsOf.and.resolveTo([]);
    mockChildrenService.getAserResultsOfChild.and.resolveTo([]);
    mockAbility = jasmine.createSpyObj(["cannot", "update"]);
    mockAbility.cannot.and.returnValue(false);
    TestBed.configureTestingModule({
      imports: [EntityDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: ActivatedRoute, useValue: mockedRoute },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityRemoveService, useValue: mockEntityRemoveService },
        { provide: EntityAbility, useValue: mockAbility },
      ],
    }).compileComponents();
  }));

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
    TestBed.inject(EntityMapperService).save(testChild);
    tick();
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
    component.isLoading = true;
    const testChild = new Child("Test-Child");
    const entityMapper = TestBed.inject(EntityMapperService);
    entityMapper.save(testChild);
    tick();
    spyOn(entityMapper, "load").and.callThrough();

    routeObserver.next({ get: () => testChild.getId() });
    expect(component.isLoading).toBeTrue();
    tick();

    expect(entityMapper.load).toHaveBeenCalledWith(Child, testChild.getId());
    expect(component.entity).toBe(testChild);
    expect(component.isLoading).toBeFalse();
  }));

  it("should navigate back when deleting an entity", fakeAsync(() => {
    const mockRemoveResult = of(RemoveResult.REMOVED);
    mockEntityRemoveService.remove.and.returnValue(mockRemoveResult);
    component.entity = new Child("Test-Child");
    // @ts-ignore
    const routerNavigateSpy = spyOn(component.router, "navigate");

    component.removeEntity();
    tick();

    expect(routerNavigateSpy).toHaveBeenCalled();
  }));

  it("should route back when deleting is undone", fakeAsync(() => {
    const mockResult = of(RemoveResult.REMOVED, RemoveResult.UNDONE);
    mockEntityRemoveService.remove.and.returnValue(mockResult);
    component.entity = new Child("Test-Child");
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");

    component.removeEntity();
    tick();

    expect(router.navigate).toHaveBeenCalled();
  }));

  it("should call router when user is not permitted to create entities", () => {
    mockAbility.cannot.and.returnValue(true);
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    routeObserver.next({ get: () => "new" });
    expect(router.navigate).toHaveBeenCalled();
  });
});
