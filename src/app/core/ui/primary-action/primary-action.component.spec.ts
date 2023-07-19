import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PrimaryActionComponent } from "./primary-action.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { SwUpdate } from "@angular/service-worker";

describe("PrimaryActionComponent", () => {
  let component: PrimaryActionComponent;
  let fixture: ComponentFixture<PrimaryActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PrimaryActionComponent, MockedTestingModule.withState()],
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
