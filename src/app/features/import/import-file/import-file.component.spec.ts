import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportFileComponent } from "./import-file.component";
import { ImportModule } from "../import.module";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("ImportSelectFileComponent", () => {
  let component: ImportFileComponent;
  let fixture: ComponentFixture<ImportFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportModule],
      declarations: [ImportFileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
