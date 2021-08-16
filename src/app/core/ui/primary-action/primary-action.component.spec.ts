import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PrimaryActionComponent } from "./primary-action.component";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { SessionService } from "../../session/session-service/session.service";
import { FormDialogModule } from "../../form-dialog/form-dialog.module";
import { PermissionsModule } from "../../permissions/permissions.module";

describe("PrimaryActionComponent", () => {
  let component: PrimaryActionComponent;
  let fixture: ComponentFixture<PrimaryActionComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue({
      name: "user",
      roles: [],
    });

    TestBed.configureTestingModule({
      declarations: [PrimaryActionComponent],
      imports: [
        MatDialogModule,
        MatButtonModule,
        FormDialogModule,
        PermissionsModule,
      ],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimaryActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
