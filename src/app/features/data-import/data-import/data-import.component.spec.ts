import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { DataImportService } from "../data-import.service";
import { FormBuilder, FormControl, Validators } from "@angular/forms";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";

describe("DataImportComponent", () => {
  let component: DataImportComponent;
  let fixture: ComponentFixture<DataImportComponent>;
  let formBuilder: FormBuilder;
  let mockDataImportService: jasmine.SpyObj<DataImportService>;
  let mockEntityMapperService: jasmine.SpyObj<EntityMapperService>;
  let mockEntitySchemaService: jasmine.SpyObj<EntitySchemaService>;
  const mockCsvFile: Blob = new Blob(["1;2;3"]);

  beforeEach(
    waitForAsync(() => {
      mockDataImportService = jasmine.createSpyObj("DataImportService", [
        "handleCsvImport",
      ]);
      mockEntityMapperService = jasmine.createSpyObj("EntityMapperService", [
        "load",
        "loadType",
        "receiveUpdates",
        "save",
        "remove",
        "sendUpdate",
      ]);
      mockEntitySchemaService = jasmine.createSpyObj("EntitySchemaService", [
        "registerSchemaDatatype",
        "getDatatypeOrDefault",
        "loadDataIntoEntity",
        "transformEntityToDatabaseFormat",
        "getComponent",
      ]);
      TestBed.configureTestingModule({
        declarations: [DataImportComponent],
        providers: [
          {
            provide: DataImportService,
            useValue: mockDataImportService,
          },
          {
            provide: EntityMapperService,
            useValue: mockEntityMapperService,
          },
          {
            provide: EntitySchemaService,
            useValue: mockEntitySchemaService,
          },
          {
            provide: FormBuilder,
            useValue: formBuilder,
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DataImportComponent);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder); // get a handle on formBuilder
    // add the mock data here
    component.entitySelectionFormGroup = formBuilder.group({
      recipientTypes: new FormControl(
        {
          value: ["mockControl1"],
          disabled: true,
        },
        Validators.required
      ),
    });
    component.fileSelectionFormGroup = formBuilder.group({
      recipientTypes: new FormControl(
        {
          value: ["mockControl2"],
          disabled: true,
        },
        Validators.required
      ),
    });
    // this fixture.detectChanges will kick off the ngOnInit
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
