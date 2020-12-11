import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminComponent } from "./admin.component";
import { AlertsModule } from "../../alerts/alerts.module";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { BackupService } from "../services/backup.service";
import { AppConfig } from "../../app-config/app-config";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ConfirmationDialogModule } from "../../confirmation-dialog/confirmation-dialog.module";

describe("AdminComponent", () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async(() => {
    AppConfig.settings = {
      site_name: "",
      database: {
        name: "unit-tests",
        remote_url: "",
        timeout: 60000,
        useTemporaryDatabase: true,
      },
      webdav: { remote_url: "" },
    };

    TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule,
        MatButtonModule,
        HttpClientTestingModule,
        AlertsModule,
        ConfirmationDialogModule,
      ],
      declarations: [AdminComponent],
      providers: [
        { provide: BackupService, useValue: new BackupService(null, null) },
        { provide: AppConfig, useValue: { load: () => {} } },
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["loadType", "save"]),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
