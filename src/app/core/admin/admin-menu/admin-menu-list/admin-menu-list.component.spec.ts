import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminMenuListComponent } from "./admin-menu-list.component";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminComponent", () => {
  let component: AdminMenuListComponent;
  let fixture: ComponentFixture<AdminMenuListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenuListComponent, FontAwesomeTestingModule],
      providers: [{ provide: MenuService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
