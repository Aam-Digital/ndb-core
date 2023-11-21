import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigureEnumPopupComponent } from "./configure-enum-popup.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ConfigurableEnum } from "../configurable-enum";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { EMPTY } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { genders } from "../../../../child-dev-project/children/model/genders";
import { Child } from "../../../../child-dev-project/children/model/child";
import { ConfirmationDialogService } from "../../../common-components/confirmation-dialog/confirmation-dialog.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../entity/database-entity.decorator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ConfigureEnumPopupComponent", () => {
  let component: ConfigureEnumPopupComponent;
  let fixture: ComponentFixture<ConfigureEnumPopupComponent>;
  let entityMapper: MockEntityMapperService;

  beforeEach(async () => {
    entityMapper = mockEntityMapper();
    await TestBed.configureTestingModule({
      imports: [
        ConfigureEnumPopupComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: new ConfigurableEnum() },
        { provide: MatDialogRef, useValue: { afterClosed: () => EMPTY } },
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureEnumPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show a popup if user tries to delete an enum that is still in use", async () => {
    component.enumEntity = new ConfigurableEnum("genders");
    component.enumEntity.values = genders;
    const male = genders.find((g) => g.id === "M");
    const female = genders.find((g) => g.id === "F");
    const m1 = new Child();
    m1.gender = male;
    const m2 = new Child();
    m2.gender = male;
    const f1 = new Child();
    f1.gender = female;
    const other = new Child();
    entityMapper.addAll([m1, m2, f1, other]);
    const confirmationSpy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation",
    );

    await component.delete(male, genders.indexOf(male));

    expect(confirmationSpy).toHaveBeenCalledWith(
      "Delete option",
      jasmine.stringContaining(
        `The option is still used in 2 ${Child.label} records.`,
      ),
    );

    entityMapper.delete(m1);
    entityMapper.delete(m2);

    await component.delete(male, genders.indexOf(male));

    expect(confirmationSpy).toHaveBeenCalledWith(
      "Delete option",
      `Are you sure that you want to delete the option "${male.label}"?`,
    );
  });
});
