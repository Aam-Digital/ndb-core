import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AdminEntityFieldComponent } from "./admin-entity-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

export default {
  title: "Core/Admin/Entity Field",
  component: AdminEntityFieldComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      imports: [AdminEntityFieldComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            entitySchemaField: { id: "name" },
            entityType: TestEntity,
          },
        },
        { provide: MatDialogRef, useValue: null },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<AdminEntityFieldComponent> = (args) => ({
  component: AdminEntityFieldComponent,
  props: args,
});

export const EditExisting = {
  render: Template,

  args: {
    fieldId: "name",
    entitySchemaField: {
      dataType: "string",
      label: "Firstname",
      description: "abc",
    } as EntitySchemaField,
    entityType: TestEntity,
  },
};

export const CreateNew = {
  render: Template,

  args: {
    fieldId: null,
    entityType: TestEntity,
  },
};
