import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportReviewDataComponent } from "./import-review-data.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ImportModule } from "../import.module";

describe("ImportReviewDataComponent", () => {
  let component: ImportReviewDataComponent;
  let fixture: ComponentFixture<ImportReviewDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportModule],
      declarations: [ImportReviewDataComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportReviewDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
