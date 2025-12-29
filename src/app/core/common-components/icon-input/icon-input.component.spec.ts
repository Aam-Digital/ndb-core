import { ComponentFixture, TestBed } from "@angular/core/testing";
import { IconComponent } from "./icon-input.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("IconInputComponent", () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
