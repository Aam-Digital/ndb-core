import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ShowFileComponent } from "./show-file.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

describe("ShowFileComponent", () => {
  let component: ShowFileComponent;
  let fixture: ComponentFixture<ShowFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShowFileComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: "" }],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
