import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DataPrivacyComponent } from "./data-privacy.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("DataPrivacyComponent", () => {
  let component: DataPrivacyComponent;
  let fixture: ComponentFixture<DataPrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataPrivacyComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DataPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
