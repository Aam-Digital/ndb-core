import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMenuItemComponent } from './admin-menu-item.component';
import { ConfigService } from 'app/core/config/config.service';
import { ViewConfig } from 'app/core/config/dynamic-routing/view-config.interface';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NEVER } from 'rxjs';
import { MenuItem } from 'app/core/ui/navigation/menu-item';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';

describe('AdminMenuItemComponent', () => {
  let component: AdminMenuItemComponent;
  let fixture: ComponentFixture<AdminMenuItemComponent>;

  let menuItem: MenuItem;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(async () => {
    menuItem = {
      label: "Test",
      icon: "user",
      link: "",
    }

    mockConfigService = jasmine.createSpyObj(["getAllConfigs"]);
    mockConfigService.getAllConfigs.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [AdminMenuItemComponent, NoopAnimationsModule, FontAwesomeTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { item: menuItem } },
        { provide: MatDialogRef, useValue: { afterClosed: () => NEVER } },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  fit('should load availableRoutes from config service and skip routes with /:id', () => {
    //when
    let testView1: ViewConfig = {
      _id: "child",
      component: "ChildrenList",
      config: { entityType: "Child"
        //...
       }
    };
    let testView2: ViewConfig = {
      _id: "school",
      component: "EntityList",
      config: { entityType: "School"
        //...
       }
    };
    let testView3: ViewConfig = {
      _id: "note/:id",
      component: "NoteDetails",
      config: { entityType: "Note" 
        //...
      }
    };
    let testView4: ViewConfig = {
      _id: "view:",
      component: "Dashboard",
      config: { widgets: [] }  // No entityType
    };
  
    mockConfigService.getAllConfigs.and.returnValue([
      testView1, testView2, testView3, testView4
    ]);
    
    // action
    component.ngOnInit();
    

    // then
    expect(component.availableRoutes).toEqual([
      { value: "child", label: "Child" },
      { value: "school", label: "School" },
      { value: "view:", label: "Dashboard" },  // Fallback label from component name
    ]);
  });  
});
