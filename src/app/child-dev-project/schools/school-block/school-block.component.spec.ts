import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SchoolBlockComponent } from "./school-block.component";
import { RouterTestingModule } from "@angular/router/testing";
import { School } from "../model/school";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { ConfigService } from "../../../core/config/config.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("SchoolBlockComponent", () => {
  let component: SchoolBlockComponent;
  let fixture: ComponentFixture<SchoolBlockComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(waitForAsync(() => {
    mockEntityMapper = jasmine.createSpyObj(["load"]);
    mockConfigService = jasmine.createSpyObj(["getConfig"]);

    TestBed.configureTestingModule({
      imports: [
        SchoolBlockComponent,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolBlockComponent);
    component = fixture.componentInstance;
    component.entity = new School("");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
