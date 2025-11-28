import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SubscriptionInfoComponent } from "./subscription-info.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("SubscriptionInfoComponent", () => {
  let component: SubscriptionInfoComponent;
  let fixture: ComponentFixture<SubscriptionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionInfoComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
