import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminDashboardComponent } from "./admin-dashboard.component";
import { SyncStateSubject } from "../../session/session-type";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigService } from "../../config/config.service";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { WidgetComponentSelectComponent } from "../admin-entity-details/widget-component-select/widget-component-select.component";

describe("AdminDashboardComponent", () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  const mockConfigService = jasmine.createSpyObj("ConfigService", ["getConfig"]);
  const mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

  beforeEach(async () => {
    mockConfigService.getConfig.and.returnValue({
      config: {
        widgets: [],
      },
    });

    await TestBed.configureTestingModule({
      imports: [
        AdminDashboardComponent,
        FontAwesomeTestingModule,
        WidgetComponentSelectComponent,
      ],
      providers: [
        { provide: SyncStateSubject, useValue: {} },
        { provide: CurrentUserSubject, useValue: {} },
        { provide: EntityRegistry, useValue: {} },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should add a new widget", async () => {
    const newWidget = { component: "ShortcutDashboard", config: {} };
    mockDialog.open.and.returnValue({
      afterClosed: () => of(newWidget),
    } as any);

    await component.addNewWidget();
    expect(component.dashboardConfig.widgets).toContain(newWidget);
  });
});