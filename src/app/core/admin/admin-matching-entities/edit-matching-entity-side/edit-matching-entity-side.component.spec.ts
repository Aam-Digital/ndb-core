import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditMatchingEntitySideComponent } from "./edit-matching-entity-side.component";
import { ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { AdminListManagerComponent } from "../../admin-list-manager/admin-list-manager.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

fdescribe("EditMatchingEntitySideComponent", () => {
  let component: EditMatchingEntitySideComponent;
  let fixture: ComponentFixture<EditMatchingEntitySideComponent>;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMatchingEntitySideComponent, FontAwesomeTestingModule],
    }).compileComponents();

    formBuilder = TestBed.inject(FormBuilder);
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
