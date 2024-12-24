import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationCenterSelectComponent } from "./notification-center-select.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("NotificationCenterSelectComponent", () => {
  let component: NotificationCenterSelectComponent;
  let fixture: ComponentFixture<NotificationCenterSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCenterSelectComponent, BrowserAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterSelectComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
