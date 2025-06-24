import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminMenuItemComponent } from "./admin-menu-item.component";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminMenuItemComponent", () => {
  let component: AdminMenuItemComponent;
  let fixture: ComponentFixture<AdminMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenuItemComponent, FontAwesomeTestingModule],
      providers: [{ provide: MenuService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
