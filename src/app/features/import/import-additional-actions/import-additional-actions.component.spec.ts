import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ImportModule } from "../import.module";

describe("ImportAdditionalActionsComponent", () => {
  let component: ImportAdditionalActionsComponent;
  let fixture: ComponentFixture<ImportAdditionalActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportModule, MockedTestingModule],
      declarations: [ImportAdditionalActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportAdditionalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
