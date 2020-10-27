import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BasicInfoComponent } from "./basic-info.component";
import { FormBuilder } from "@angular/forms";
import { EntityMapperService } from "../../../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../../../core/entity/schema/entity-schema.service";
import { Database } from "../../../../../core/database/database";
import { MockDatabase } from "../../../../../core/database/mock-database";
import { AlertService } from "../../../../../core/alerts/alert.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { ChildPhotoService } from "../../../child-photo-service/child-photo.service";
import { Router } from "@angular/router";
import { SessionService } from "../../../../../core/session/session-service/session.service";
import { User } from "../../../../../core/user/user";
import { EntitySubrecordModule } from "../../../../../core/entity-subrecord/entity-subrecord.module";

describe("BasicInfoComponent", () => {
  let component: BasicInfoComponent;
  let fixture: ComponentFixture<BasicInfoComponent>;

  const mockChildPhotoService: jasmine.SpyObj<ChildPhotoService> = jasmine.createSpyObj(
    "mockChildPhotoService",
    ["canSetImage", "setImage"]
  );

  const mockRouter: jasmine.SpyObj<Router> = jasmine.createSpyObj(
    "mockRouter",
    ["navigate"]
  );

  const mockSessionService: jasmine.SpyObj<SessionService> = jasmine.createSpyObj(
    "mockSessionService",
    { getCurrentUser: new User("test-user") }
  );

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BasicInfoComponent],
      imports: [MatSnackBarModule, EntitySubrecordModule],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
        FormBuilder,
        AlertService,
        { provide: ChildPhotoService, useValue: mockChildPhotoService },
        { provide: Router, useValue: mockRouter },
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // it("should create with edit mode", () => {
  //   mockChildPhotoService.canSetImage.and.returnValue(true);
  //   component.switchEdit();
  //
  //   fixture.detectChanges();
  //
  //   expect(component).toBeTruthy();
  // });
});
