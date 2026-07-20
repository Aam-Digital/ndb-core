import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import { EntityTypeLabelPipe } from "../../../common-components/entity-type-label/entity-type-label.pipe";
import { MatDialog } from "@angular/material/dialog";
import { mockEntityMapperProvider } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { entityAbilityFactory } from "../../../permissions/ability/testing-entity-ability-factory";
import { ImportAdditionalService } from "../import-additional.service";

describe("ImportAdditionalActionsComponent", () => {
  let component: ImportAdditionalActionsComponent;
  let fixture: ComponentFixture<ImportAdditionalActionsComponent>;

  const mockActions = [
    { targetType: "School", expertOnly: false } as any,
    { targetType: "RecurringActivity", expertOnly: false } as any,
    // targetType can also be an array of allowed types
    { targetType: ["Note", "RecurringActivity"], expertOnly: false } as any,
    { targetType: ["Note", "School"], expertOnly: false } as any,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ImportAdditionalActionsComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        EntityTypeLabelPipe,
        { provide: MatDialog, useValue: null },
        ...mockEntityMapperProvider(),
        EntityRegistry,
        { provide: EntityAbility, useFactory: entityAbilityFactory },
        {
          provide: ImportAdditionalService,
          useValue: {
            getActionsLinkingFor: () => [...mockActions],
            createActionLabel: () => "",
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportAdditionalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should hide actions unless the user can update at least one target type", () => {
    const ability = TestBed.inject(EntityAbility);
    ability.update([
      { subject: "all", action: "manage" },
      { subject: "School", action: "update", inverted: true },
      { subject: "Note", action: "update", inverted: true },
    ]);
    ability.initialized = true;
    fixture.componentRef.setInput("entityType", "Child");

    const targets = component.availableImportActions().map((a) => a.targetType);
    // updatable single type kept, non-updatable single type dropped
    expect(targets).toContainEqual("RecurringActivity");
    expect(targets).not.toContainEqual("School");
    // array target kept if ANY type is updatable, dropped if none are
    expect(targets).toContainEqual(["Note", "RecurringActivity"]);
    expect(targets).not.toContainEqual(["Note", "School"]);
  });
});
