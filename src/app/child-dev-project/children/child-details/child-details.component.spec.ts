import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { ChildDetailsComponent } from "./child-details.component";
import { MockDatabase } from "../../../core/database/mock-database";
import { ChildPhotoService } from "../child-photo-service/child-photo.service";
import { Observable } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { SessionService } from "../../../core/session/session-service/session.service";
import { User } from "../../../core/user/user";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenModule } from "../children.module";
import { databaseServiceProvider } from "../../../core/database/database.service.provider";

describe("ChildDetailsComponent", () => {
  let component: ChildDetailsComponent;
  let fixture: ComponentFixture<ChildDetailsComponent>
  const mockedRoute = {
    paramMap: Observable.create((observer) =>
      observer.next({ get: () => "new" })
    ),
  };
  const mockedRouter = { navigate: () => null };
  const mockedLocation = { back: () => null };
  const mockedDatabase = new MockDatabase();
  const mockedSession = {
    getCurrentUser: () => new User("test1"),
    getDatabase: () => mockedDatabase,
  };
  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
    "mockChildPhotoService",
    [
      "canSetImage",
      "setImage",
    ]);

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
});
