import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { FormBuilder } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatStepperModule } from "@angular/material/stepper";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AlertsModule } from "../../../core/alerts/alerts.module";
import { DynamicEntityService } from "../../../core/entity/dynamic-entity.service";

describe("DataImportComponent", () => {
  let component: DataImportComponent;
  let fixture: ComponentFixture<DataImportComponent>;
  let mockDataImportService: jasmine.SpyObj<DataImportService>;

  beforeEach(
    waitForAsync(() => {
      mockDataImportService = jasmine.createSpyObj("DataImportService", [
        "handleCsvImport",
      ]);
      TestBed.configureTestingModule({
        declarations: [DataImportComponent],
        imports: [
          FormsModule,
          MatButtonModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatStepperModule,
          ReactiveFormsModule,
          BrowserAnimationsModule,
          AlertsModule,
        ],
        providers: [
          FormBuilder,
          {
            provide: DataImportService,
            useValue: mockDataImportService,
          },
          {
            provide: DynamicEntityService,
            useValue: new DynamicEntityService(undefined, undefined),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DataImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
