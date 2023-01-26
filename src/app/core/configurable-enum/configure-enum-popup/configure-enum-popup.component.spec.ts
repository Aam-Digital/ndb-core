import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigureEnumPopupComponent } from "./configure-enum-popup.component";

describe("ConfigureEnumPopupComponent", () => {
  let component: ConfigureEnumPopupComponent;
  let fixture: ComponentFixture<ConfigureEnumPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigureEnumPopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureEnumPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
