import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotificationMethodSelectComponent } from "./notification-method-select.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("NotificationCenterSelectComponent", () => {
  let component: NotificationMethodSelectComponent;
  let fixture: ComponentFixture<NotificationMethodSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationMethodSelectComponent, BrowserAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationMethodSelectComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
