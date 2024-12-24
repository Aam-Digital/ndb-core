import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityTypeSelectComponent } from "./entity-type-select.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

describe("EntityTypeSelectComponent", () => {
  let component: EntityTypeSelectComponent;
  let fixture: ComponentFixture<EntityTypeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityTypeSelectComponent,
        MockedTestingModule.withState(),
        ReactiveFormsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityTypeSelectComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
