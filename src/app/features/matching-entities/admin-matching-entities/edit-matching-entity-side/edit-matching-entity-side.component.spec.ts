import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditMatchingEntitySideComponent } from "./edit-matching-entity-side.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MatDialog } from "@angular/material/dialog";
import {
  entityRegistry,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";
import { FormControl, FormGroup } from "@angular/forms";

describe("EditMatchingEntitySideComponent", () => {
  let component: EditMatchingEntitySideComponent;
  let fixture: ComponentFixture<EditMatchingEntitySideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMatchingEntitySideComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: EntityRegistry,
          useValue: entityRegistry,
        },
        {
          provide: MatDialog,
          useValue: { open: jasmine.createSpy("open") },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMatchingEntitySideComponent);
    component = fixture.componentInstance;

    component.controlName = "entityType";
    component.form = new FormGroup({
      entityType: new FormControl(""),
    });
    component.sideConfig = {
      entityType: "TestEntity1",
      columns: [],
      availableFilters: [],
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
