import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildSelectComponent } from "./child-select.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ChildrenService } from "../children.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SchoolBlockComponent } from "../../schools/school-block/school-block.component";
import { of } from "rxjs";
import { Child } from "../model/child";
import { RouterTestingModule } from "@angular/router/testing";
import { ChildBlockComponent } from "../child-block-list/child-block/child-block.component";

function createTestData() {
  const c1 = new Child("1");
  const c2 = new Child("4");
  const c3 = new Child("5");

  return [c1, c2, c3];
}

describe("ChildSelectComponent", () => {
  let component: ChildSelectComponent;
  let fixture: ComponentFixture<ChildSelectComponent>;

  const mockChildrenService = {
    getChildren() {
      return of(createTestData());
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ChildSelectComponent,
        ChildBlockComponent,
        SchoolBlockComponent,
      ],
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule,
        FormsModule,
        CommonModule,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should increase and shrink after selecting/un-selecting", function () {
    let previousLength = component.selectedChildren.length;
    component.selectChild(new Child("1"));
    expect(component.selectedChildren.length).toBe(previousLength + 1);

    previousLength = component.selectedChildren.length;
    component.unselectChild(new Child("1"));
    expect(component.selectedChildren.length).toBe(previousLength - 1);
  });
});
