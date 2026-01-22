import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportAdditionalActionsComponent } from "./import-additional-actions.component";
import { EntityTypeLabelPipe } from "../../../common-components/entity-type-label/entity-type-label.pipe";
import { MatDialog } from "@angular/material/dialog";
import { mockEntityMapperProvider } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";


describe("ImportAdditionalActionsComponent", () => {
  let component: ImportAdditionalActionsComponent;
  let fixture: ComponentFixture<ImportAdditionalActionsComponent>;

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
        { provide: EntityAbility, useClass: EntityAbility },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportAdditionalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
