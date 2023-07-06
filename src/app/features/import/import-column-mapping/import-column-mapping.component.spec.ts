import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportColumnMappingComponent } from "./import-column-mapping.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ImportModule } from "../import.module";

describe("ImportMapColumnsComponent", () => {
  let component: ImportColumnMappingComponent;
  let fixture: ComponentFixture<ImportColumnMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule, ImportModule],
      declarations: [ImportColumnMappingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportColumnMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
