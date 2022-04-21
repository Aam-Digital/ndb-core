import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PrimaryActionComponent } from "./primary-action.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { UiModule } from "../ui.module";
import { SwUpdate } from "@angular/service-worker";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("PrimaryActionComponent", () => {
  let component: PrimaryActionComponent;
  let fixture: ComponentFixture<PrimaryActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UiModule,
        MockedTestingModule.withState(),
        FontAwesomeTestingModule,
      ],
      providers: [{ provide: SwUpdate, useValue: {} }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimaryActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
