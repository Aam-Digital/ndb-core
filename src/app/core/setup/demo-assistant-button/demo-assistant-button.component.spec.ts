import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DemoAssistantButtonComponent } from "./demo-assistant-button.component";

describe("DemoAssistantButtonComponent", () => {
  let component: DemoAssistantButtonComponent;
  let fixture: ComponentFixture<DemoAssistantButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoAssistantButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoAssistantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
