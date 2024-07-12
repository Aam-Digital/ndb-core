import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditLocationComponent } from "./edit-location.component";
import { setupEditComponent } from "../../../core/entity/default-datatype/edit-component.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EditLocationComponent", () => {
  let component: EditLocationComponent;
  let fixture: ComponentFixture<EditLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditLocationComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditLocationComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
