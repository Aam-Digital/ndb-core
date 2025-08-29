import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MenuItemFormComponent } from "./menu-item-form.component";
import { MenuItem } from "../core/ui/navigation/menu-item";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("MenuItemFormComponent", () => {
  let component: MenuItemFormComponent;
  let fixture: ComponentFixture<MenuItemFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItemFormComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuItemFormComponent);
    component = fixture.componentInstance;

    component.item = {
      label: "Test",
      icon: "test-icon",
      link: "/test",
    } as MenuItem;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
