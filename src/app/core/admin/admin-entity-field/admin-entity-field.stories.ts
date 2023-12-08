import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { AdminEntityFieldComponent } from "./admin-entity-field.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { School } from "../../../child-dev-project/schools/model/school";

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
            entitySchemaField: { id: null },
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

export const EditExisting = Template.bind({});
EditExisting.args = {
  fieldId: "name",
  entitySchemaField: {
    dataType: "string",
    label: "Firstname",
    description: "abc",
  } as EntitySchemaField,
  entityType: School,
};

export const CreateNew = Template.bind({});
CreateNew.args = {
  fieldId: null,
  entityType: School,
};
