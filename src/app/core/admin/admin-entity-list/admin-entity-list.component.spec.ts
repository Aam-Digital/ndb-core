import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityListComponent } from "./admin-entity-list.component";
import { FilterGeneratorService } from "../../filter/filter-generator/filter-generator.service";
import { FilterService } from "../../filter/filter.service";
import { ActivatedRoute } from "@angular/router";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Entity } from "../../entity/model/entity";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { toFormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { SyncStateSubject } from "../../session/session-type";
import { CurrentUserSubject } from "../../session/current-user-subject";

describe("AdminEntityListComponent", () => {
  let component: AdminEntityListComponent;
  let fixture: ComponentFixture<AdminEntityListComponent>;
  let mockFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(async () => {
    mockFormService = jasmine.createSpyObj(["extendFormFieldConfig"]);
    mockFormService.extendFormFieldConfig.and.callFake((c) =>
      toFormFieldConfig(c),
    );
    await TestBed.configureTestingModule({
      imports: [
        AdminEntityListComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: FilterGeneratorService, useValue: {} },
        { provide: FilterService, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        { provide: EntityFormService, useValue: mockFormService },
        { provide: EntityRegistry, useValue: entityRegistry },
        SyncStateSubject,
        CurrentUserSubject,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityListComponent);
    component = fixture.componentInstance;

    component.entityConstructor = Entity;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
