import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EducationalMaterialComponent } from "./educational-material.component";
import { FormsModule } from "@angular/forms";
import { ChildrenService } from "../../children/children.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { Child } from "../../children/model/child";
import { DatePipe } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { Database } from "../../../core/database/database";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { AlertService } from "app/core/alerts/alert.service";
import { ChildrenModule } from "../../children/children.module";
import { RouterTestingModule } from "@angular/router/testing";

describe("EducationalMaterialComponent", () => {
  let component: EducationalMaterialComponent;
  let fixture: ComponentFixture<EducationalMaterialComponent>;

  const mockChildrenService = {
    getChild: () => {
      return of([new Child("22")]);
    },
    getEducationalMaterialsOfChild: () => {
      return of([]);
    },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        NoopAnimationsModule,
        ChildrenModule,
        RouterTestingModule,
      ],
      providers: [
        DatePipe,
        { provide: ChildrenService, useValue: mockChildrenService },
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
        AlertService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EducationalMaterialComponent);
    component = fixture.componentInstance;
    component.child = new Child("22");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
