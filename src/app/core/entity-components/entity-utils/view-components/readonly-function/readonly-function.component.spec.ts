import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReadonlyFunctionComponent } from "./readonly-function.component";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { EntityFunctionPipe } from "./entity-function.pipe";
import { FormControl, FormGroup } from "@angular/forms";
import { By } from "@angular/platform-browser";

describe("ReadonlyFunctionComponent", () => {
  let component: ReadonlyFunctionComponent;
  let fixture: ComponentFixture<ReadonlyFunctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReadonlyFunctionComponent, EntityFunctionPipe],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadonlyFunctionComponent);
    component = fixture.componentInstance;
    const formGroup = new FormGroup({});
    const formControl = new FormControl();
    formGroup.registerControl('name', formControl);
    component.onInitFromDynamicConfig({
      entity: Child.create('nameBefore'),
      id: "",
      formGroup: formGroup,
      config: (entity) => entity.name,
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  fit("should display a new name as soon as it is entered into the corresponding form group entry", () => {
    const displayElement: HTMLDivElement = fixture.debugElement.nativeElement.querySelector('div');
    expect(displayElement.textContent).toBe(" nameBefore\n");
    
    component.formGroup.setValue({name: "nameAfter"});
    fixture.detectChanges();
    
    expect(displayElement.textContent).toBe(" nameAfter\n");
  });

});
