import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationCenterSelectComponent } from "./notification-center-select.component";

describe("NotificationCenterSelectComponent", () => {
  let component: NotificationCenterSelectComponent;
  let fixture: ComponentFixture<NotificationCenterSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCenterSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterSelectComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
