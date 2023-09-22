import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UserSelectComponent } from "./user-select.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

describe("UserSelectComponent", () => {
  let component: UserSelectComponent;
  let fixture: ComponentFixture<UserSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserSelectComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: [] }],
    });
    fixture = TestBed.createComponent(UserSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
