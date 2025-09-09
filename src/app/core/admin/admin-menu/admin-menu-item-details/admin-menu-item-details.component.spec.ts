import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminMenuItemDetailsComponent } from "./admin-menu-item-details.component";
import { ConfigService } from "app/core/config/config.service";
import { ViewConfig } from "app/core/config/dynamic-routing/view-config.interface";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NEVER, Subject } from "rxjs";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MenuService } from "app/core/ui/navigation/menu.service";

describe("AdminMenuItemDetailsComponent", () => {
  let component: AdminMenuItemDetailsComponent;
  let fixture: ComponentFixture<AdminMenuItemDetailsComponent>;

  let menuItem: MenuItem;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let configUpdates$: Subject<void>;

  beforeEach(async () => {
    menuItem = {
      label: "Test",
      icon: "user",
      link: "",
    };

    configUpdates$ = new Subject<void>();
    mockConfigService = jasmine.createSpyObj(["getAllConfigs", "getConfig"], {
      configUpdates: configUpdates$.asObservable(),
    });
    mockConfigService.getAllConfigs.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [
        AdminMenuItemDetailsComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { item: menuItem } },
        { provide: MatDialogRef, useValue: { afterClosed: () => NEVER } },
        { provide: ConfigService, useValue: mockConfigService },
        EntityRegistry,
        MenuService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load availableRoutes from config service and skip routes with /:id", () => {
    //when
    let testView1: ViewConfig = {
      _id: "view:child",
      component: "ChildrenList",
      config: {
        entityType: "Child",
        //...
      },
    };
    let testView2: ViewConfig = {
      _id: "view:school",
      component: "EntityList",
      config: {
        entityType: "School",
        //...
      },
    };
    let testView3: ViewConfig = {
      _id: "view:note/:id",
      component: "NoteDetails",
      config: {
        entityType: "Note",
        //...
      },
    };
    let testView4: ViewConfig = {
      _id: "view:",
      component: "Dashboard",
      config: { widgets: [] }, // No entityType
    };

    mockConfigService.getAllConfigs.and.returnValue([
      testView1,
      testView2,
      testView3,
      testView4,
    ]);

    // action
    component.ngOnInit();

    // then
    expect(component.availableRoutes).toEqual([
      { value: "/child", label: "Child" },
      { value: "/school", label: "School" },
      { value: "/", label: "Dashboard" }, // Fallback label from component name
    ]);
  });
});
