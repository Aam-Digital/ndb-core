import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChooseUseCaseComponent } from "./choose-use-case.component";

describe("ChooseUseCaseComponent", () => {
  let component: ChooseUseCaseComponent;
  let fixture: ComponentFixture<ChooseUseCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseUseCaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseUseCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
