import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DialogCloseComponent } from "./dialog-close.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MatDialogModule } from "@angular/material/dialog";

describe("DialogCloseComponent", () => {
  let component: DialogCloseComponent;
  let fixture: ComponentFixture<DialogCloseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DialogCloseComponent,
        FontAwesomeTestingModule,
        MatDialogModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogCloseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
