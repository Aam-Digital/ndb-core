import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminDashboardComponent } from "./admin-dashboard.component";
import { SyncStateSubject } from "../../session/session-type";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { ConfigService } from "../../config/config.service";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { WidgetComponentSelectComponent } from "../../admin/admin-entity-details/widget-component-select/widget-component-select.component";

describe("AdminDashboardComponent", () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  const mockConfigService = {
    getConfig: vi.fn().mockName("ConfigService.getConfig"),
    getRawConfig: vi.fn().mockName("ConfigService.getRawConfig"),
    exportConfig: vi.fn().mockName("ConfigService.exportConfig"),
    saveConfig: vi.fn().mockName("ConfigService.saveConfig"),
  };
  const mockDialog = {
    open: vi.fn().mockName("MatDialog.open"),
  };

  beforeEach(async () => {
    mockConfigService.getRawConfig.mockReturnValue({
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
    fixture.componentRef.setInput("dashboardViewId", "Dashboard");
    fixture.detectChanges();
  });

  it("keeps a widget's other languages when saving", async () => {
    const label = { "en-US": "Record Attendance", de: "Anwesenheit" };
    const widgets = (shortcutLabel) => [
      {
        component: "ShortcutDashboard",
        config: { shortcuts: [{ label: shortcutLabel }] },
      },
    ];
    // as the real service behaves: getConfig resolves to the active language,
    // getRawConfig keeps every language
    mockConfigService.getRawConfig.mockReturnValue({
      component: "Dashboard",
      config: { widgets: widgets(label) },
    });
    mockConfigService.getConfig.mockReturnValue({
      component: "Dashboard",
      config: { widgets: widgets("Record Attendance") },
    });
    mockConfigService.exportConfig.mockReturnValue({});
    mockConfigService.saveConfig.mockResolvedValue(undefined);

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("dashboardViewId", "Dashboard");
    // no detectChanges: rendering the preview needs the widget registry, and
    // the signals read below compute lazily anyway

    await component.save();

    const saved = mockConfigService.saveConfig.mock.calls[0][0];
    expect(
      saved["view:Dashboard"].config.widgets[0].config.shortcuts[0].label,
    ).toEqual(label);
  });

  it("should add a new widget", async () => {
    const newWidget = { component: "ShortcutDashboard", config: {} };
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(newWidget),
    } as any);

    await component.addNewWidget();
    expect(component.dashboardConfig().widgets).toContain(newWidget);
  });
});
