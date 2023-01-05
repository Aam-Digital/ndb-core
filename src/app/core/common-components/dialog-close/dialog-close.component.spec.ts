import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DialogCloseComponent } from "./dialog-close.component";
import { DialogModule } from "@angular/cdk/dialog";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("DialogCloseComponent", () => {
  let component: DialogCloseComponent;
  let fixture: ComponentFixture<DialogCloseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogCloseComponent],
      imports: [DialogModule, MatButtonModule, FontAwesomeTestingModule],
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
