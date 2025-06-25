import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AssistantDialogComponent } from "./assistant-dialog.component";
import { MatDialogRef } from "@angular/material/dialog";
import { ConfigService } from "../../config/config.service";
import { ActivatedRoute } from "@angular/router";
import { DemoDataInitializerService } from "../../demo-data/demo-data-initializer.service";
import { SetupService } from "../setup.service";
import { LOCATION_TOKEN } from "../../../utils/di-tokens";
import { LanguageService } from "app/core/language/language.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapperProvider } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AssistantDialogComponent", () => {
  let component: AssistantDialogComponent;
  let fixture: ComponentFixture<AssistantDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantDialogComponent, FontAwesomeTestingModule],
      providers: [
        {
          provide: ConfigService,
          useValue: jasmine.createSpyObj(["hasConfig"]),
        },
        {
          provide: DemoDataInitializerService,
          useValue: jasmine.createSpyObj(["generateDemoData"]),
        },
        {
          provide: EntityMapperService,
          useValue: mockEntityMapperProvider(),
        },
        {
          provide: SetupService,
          useValue: jasmine.createSpyObj(["getAvailableBaseConfig"]),
        },
        { provide: MatDialogRef, useValue: {} },
        { provide: ActivatedRoute, useValue: null },
        {
          provide: LanguageService,
          useValue: jasmine.createSpyObj(["getCurrentLocale"]),
        },
        { provide: LOCATION_TOKEN, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
