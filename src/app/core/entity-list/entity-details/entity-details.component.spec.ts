import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityDetailsComponent } from "./entity-details.component";
import { Observable, of, Subscriber } from "rxjs";
import { MockDatabase } from "../../database/mock-database";
import { User } from "../../user/user";
import { ChildPhotoService } from "../../../child-dev-project/children/child-photo-service/child-photo.service";
import { ChildrenModule } from "../../../child-dev-project/children/children.module";
import { MatNativeDateModule } from "@angular/material/core";
import { databaseServiceProvider } from "../../database/database.service.provider";
import { SessionService } from "../../session/session-service/session.service";
import { Location } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";

describe("EntityDetailsComponent", () => {
  let component: EntityDetailsComponent;
  let fixture: ComponentFixture<EntityDetailsComponent>;

  let routeObserver: Subscriber<any>;
  const mockedRoute = {
    paramMap: new Observable((observer) => {
      routeObserver = observer;
      observer.next({ get: () => "new" });
    }),
    data: of({
      panels: [
        {
          title: "One Form",
          components: [
            { title: "", component: "Form", config: { cols: [[]] } },
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
      icon: "child",
    }),
  };
  const mockedRouter = { navigate: () => null, resetConfig: () => {} };
  const mockedLocation = { back: () => null };
  const mockedDatabase = new MockDatabase();
  const mockedSession = {
    getCurrentUser: () => new User("test1"),
    getDatabase: () => mockedDatabase,
  };
  const mockChildPhotoService: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
    "mockChildPhotoService",
    ["canSetImage", "setImage", "getImageAsyncObservable"]
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ChildrenModule, MatNativeDateModule],
      providers: [
        databaseServiceProvider,
        { provide: SessionService, useValue: mockedSession },
        { provide: Location, useValue: mockedLocation },
        { provide: Router, useValue: mockedRouter },
        { provide: ActivatedRoute, useValue: mockedRoute },
        { provide: ChildPhotoService, useValue: mockChildPhotoService },
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

  it("sets the panels according to the config", () => {
    const testChild = new Child("Test-Child");
    const entityService = fixture.componentRef.injector.get(
      EntityMapperService
    );
    const childrenService = fixture.componentRef.injector.get(ChildrenService);
    spyOn(childrenService, "getChild").and.returnValue(of(testChild));
    entityService.save<Child>(testChild);
    component.creatingNew = false;
    routeObserver.next({ get: () => testChild.getId() });
    const expectedPanels = [
      {
        title: "One Form",
        components: [
          {
            title: "",
            component: "Form",
            config: {
              child: testChild,
              config: { cols: [[]] },
              creatingNew: false,
            },
          },
        ],
      },
      {
        title: "Two Components",
        components: [
          {
            title: "First Component",
            component: "PreviousSchools",
            config: { child: testChild, config: undefined, creatingNew: false },
          },
          {
            title: "Second Component",
            component: "Aser",
            config: { child: testChild, config: undefined, creatingNew: false },
          },
        ],
      },
    ];
    expect(component.panels).toEqual(expectedPanels);
  });

  it("should load the correct child on startup", () => {
    const testChild = new Child("Test-Child");
    const entityService = fixture.componentRef.injector.get(
      EntityMapperService
    );
    const childrenService = fixture.componentRef.injector.get(ChildrenService);
    spyOn(childrenService, "getChild").and.returnValue(of(testChild));
    entityService.save<Child>(testChild);
    routeObserver.next({ get: () => testChild.getId() });
    fixture.detectChanges();
    expect(childrenService.getChild).toHaveBeenCalledWith(testChild.getId());
    expect(component.entity).toBe(testChild);
  });
});
