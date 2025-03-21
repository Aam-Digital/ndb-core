import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MergeFieldsComponent } from "./merge-fields.component";

describe("MergeFieldsComponent", () => {
  let component: MergeFieldsComponent;
  let fixture: ComponentFixture<MergeFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeFieldsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MergeFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
