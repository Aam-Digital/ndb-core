import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

import { IconButtonComponent } from "./icon-button.component";

describe("IconButtonComponent", () => {
  let component: IconButtonComponent;
  let fixture: ComponentFixture<IconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButtonComponent, MatButtonModule, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display icon", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.detectChanges();

    const iconElement = fixture.nativeElement.querySelector("fa-icon");
    expect(iconElement).toBeTruthy();
    expect(iconElement.classList.contains("standard-icon-with-text")).toBe(
      true,
    );
  });

  it("should apply correct button type", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.componentRef.setInput("buttonType", "mat-raised-button");
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector(
      "button[mat-raised-button]",
    );
    expect(buttonElement).toBeTruthy();
  });

  it("should default to mat-stroked-button when no buttonType specified", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector(
      "button[mat-stroked-button]",
    );
    expect(buttonElement).toBeTruthy();
  });

  it("should apply color through CSS classes", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.componentRef.setInput("color", "primary");
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector("button");
    expect(buttonElement.classList.contains("mat-primary")).toBe(true);
  });

  it("should apply custom CSS class", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.componentRef.setInput("cssClass", "custom-class");
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector("button");
    expect(buttonElement.classList.contains("custom-class")).toBe(true);
  });

  it("should emit click events", () => {
    fixture.componentRef.setInput("icon", "edit");

    let clickedEvent: Event | undefined;
    component.buttonClick.subscribe((event) => {
      clickedEvent = event;
    });

    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector("button");
    buttonElement.click();

    expect(clickedEvent).toBeDefined();
  });

  it("should have type='button' attribute", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector("button");
    expect(buttonElement.type).toBe("button");
  });

  it("should apply angulartics2 attributes", () => {
    fixture.componentRef.setInput("icon", "edit");
    fixture.componentRef.setInput("angulartics2On", "click");
    fixture.componentRef.setInput("angularticsCategory", "UserAction");
    fixture.componentRef.setInput("angularticsAction", "test_action");
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector("button");
    expect(buttonElement.getAttribute("angulartics2On")).toBe("click");
    expect(buttonElement.getAttribute("angularticsCategory")).toBe(
      "UserAction",
    );
    expect(buttonElement.getAttribute("angularticsAction")).toBe("test_action");
  });
});
