import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportantNotesComponent } from "./important-notes.component";

describe("ImportantNotesComponent", () => {
  let component: ImportantNotesComponent;
  let fixture: ComponentFixture<ImportantNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImportantNotesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportantNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
