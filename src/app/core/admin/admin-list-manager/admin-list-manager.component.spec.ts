import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminListManagerComponent } from "./admin-list-manager.component";

describe("AdminListManagerComponent", () => {
  let component: AdminListManagerComponent;
  let fixture: ComponentFixture<AdminListManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminListManagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminListManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
