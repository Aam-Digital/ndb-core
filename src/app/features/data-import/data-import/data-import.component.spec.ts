import { ComponentFixture, TestBed, waitForAsync} from "@angular/core/testing";
import { DataImportComponent } from "./data-import.component";
import { AppConfig } from "../../../core/app-config/app-config";
import { SessionType } from "../../../core/session/session-type";
import { DataImportService } from "../data-import.service";


describe("DataImportComponent", () => {
  let component: DataImportComponent;
  let fixture: ComponentFixture<DataImportComponent>;
  let mockDataImportService: jasmine.SpyObj<DataImportService>;
  let mockCsvFile: Blob = new Blob(["1;2;3"]);

  beforeEach(
    waitForAsync(() => {
      AppConfig.settings = {
        site_name: "",
        session_type: SessionType.mock,
        database: {
          name: "unit-tests",
          remote_url: "",
        },
      };

      mockDataImportService = jasmine.createSpyObj(
        DataImportService,
        [
          "loadCsv",
        ]
      );
      TestBed.configureTestingModule({
        declarations: [ DataImportComponent ],
        providers: [
          { 
            provide: DataImportService, 
            useValue: mockDataImportService 
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

  it("should call loadCsv in DataImportService", () => {
    component.importCsvFile(mockCsvFile);
    expect(mockDataImportService.loadCsv).toHaveBeenCalledWith(mockCsvFile);
  });

});
