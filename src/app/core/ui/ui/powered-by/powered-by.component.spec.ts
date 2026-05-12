import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PoweredByComponent } from "./powered-by.component";

describe("PoweredByComponent", () => {
  let component: PoweredByComponent;
  let fixture: ComponentFixture<PoweredByComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoweredByComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PoweredByComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the Aam Digital logo", () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector(
      "img.powered-by-logo",
    );
    expect(img).toBeTruthy();
    expect(img.src).toContain("aam-digital_logo.png");
  });
});
