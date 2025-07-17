import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditMatchingEntitySideComponent } from "./edit-matching-entity-side.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EditMatchingEntitySideComponent", () => {
  let component: EditMatchingEntitySideComponent;
  let fixture: ComponentFixture<EditMatchingEntitySideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMatchingEntitySideComponent, FontAwesomeTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMatchingEntitySideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
