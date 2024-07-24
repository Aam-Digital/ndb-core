import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AnonymizeOptionsComponent } from "./anonymize-options.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("AnonymizeOptionsComponent", () => {
  let component: AnonymizeOptionsComponent;
  let fixture: ComponentFixture<AnonymizeOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymizeOptionsComponent, BrowserAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymizeOptionsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
