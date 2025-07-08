import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

import { AdminEntityDetailsComponent } from "./admin-entity-details.component";
import { EntityDetailsConfig } from "../../../entity-details/EntityDetailsConfig";
import { Entity } from "../../../entity/model/entity";
import { MatTabsModule } from "@angular/material/tabs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";

describe("AdminEntityDetailsComponent", () => {
  let component: AdminEntityDetailsComponent;
  let fixture: ComponentFixture<AdminEntityDetailsComponent>;

  let viewConfig: EntityDetailsConfig;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  @DatabaseEntity("AdminDetailsTest")
  class AdminDetailsTestEntity extends Entity {
    static override readonly ENTITY_TYPE = "AdminDetailsTest";

    @DatabaseField({ label: "Name" }) name: string;
  }

  beforeEach(() => {
    viewConfig = {
      entityType: AdminDetailsTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }],
    };
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);

    TestBed.configureTestingModule({
      imports: [
        AdminEntityDetailsComponent,
        MatTabsModule,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    });
    fixture = TestBed.createComponent(AdminEntityDetailsComponent);
    component = fixture.componentInstance;

    component.entityConstructor = AdminDetailsTestEntity;
    component.config = JSON.parse(JSON.stringify(viewConfig));

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should add new Default Section to config", () => {
    mockDialog.open.and.returnValue({
      afterClosed: () => of("default-form"),
    } as any);

    component.addComponent(component.config.panels[0]);
    expect(component.config.panels[0].components.length).toBe(1);

    const newSection = component.config.panels[0].components[0];
    expect(newSection.component).toBe("Form");
  });

  it("should add new RelatedEntities Section to config", () => {
    mockDialog.open.and.returnValue({
      afterClosed: () => of("related-form"),
    } as any);

    component.addComponent(component.config.panels[0]);
    expect(component.config.panels[0].components.length).toBe(1);

    const newRelatedSection = component.config.panels[0].components[0];
    expect(newRelatedSection.component).toBe("RelatedEntities");
  });
});
