import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminMenuItemDetailsComponent } from "./admin-menu-item-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NEVER } from "rxjs";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { ConfigService } from "app/core/config/config.service";

fdescribe("AdminMenuItemDetailsComponent", () => {
  let component: AdminMenuItemDetailsComponent;
  let fixture: ComponentFixture<AdminMenuItemDetailsComponent>;

  let menuItem: MenuItem;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async () => {
    menuItem = {
      label: "Test",
      icon: "user",
      link: "",
    };

    mockConfigService = jasmine.createSpyObj("ConfigService", [
      "getAllConfigs",
    ]);
    mockConfigService.getAllConfigs.and.returnValue([]);
    mockConfigService.configUpdates = NEVER;

    await TestBed.configureTestingModule({
      imports: [
        AdminMenuItemDetailsComponent,
        NoopAnimationsModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { item: menuItem } },
        { provide: MatDialogRef, useValue: { afterClosed: () => NEVER } },
        { provide: ConfigService, useValue: mockConfigService },
        EntityRegistry,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
