import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { ChildDetailsComponent } from "./child-details.component";
import { MockDatabase } from "../../../core/database/mock-database";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";
import { Observable, of, Subscriber } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenModule } from "../children.module";
import { databaseServiceProvider } from "../../../core/database/database.service.provider";
import { Child } from "../model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ChildrenService } from "../children.service";

describe("ChildDetailsComponent", () => {
  let component: ChildDetailsComponent;
  let fixture: ComponentFixture<ChildDetailsComponent>;

  let routeObserver: Subscriber<any>;
  const mockedRoute = {
    paramMap: new Observable((observer) => {
      routeObserver = observer;
      observer.next({ get: () => "new" });
    }),
  };
  const mockedRouter = { navigate: () => null };
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
    fixture = TestBed.createComponent(ChildDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
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
    expect(component.child).toBe(testChild);
  });
});
