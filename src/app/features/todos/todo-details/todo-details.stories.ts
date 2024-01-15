import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { TodoDetailsComponent } from "./todo-details.component";
import { Todo } from "../model/todo";
import { FormFieldConfig } from "../../../core/common-components/entity-form/FormConfig";
import { importProvidersFrom } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NEVER } from "rxjs";

const defaultColumns: FormFieldConfig[] = [
  { id: "deadline" },
  { id: "subject" },
  { id: "assignedTo" },
  { id: "description", visibleFrom: "xl" },
  { id: "repetitionInterval", visibleFrom: "xl" },
  { id: "relatedEntities", hideFromTable: true },
  { id: "completed", hideFromForm: true },
];
const todoEntity: Todo = new Todo();
todoEntity.subject = "Test Task";
todoEntity._rev = "1";

export default {
  title: "Features/Todos/TodoDetails",
  component: TodoDetailsComponent,
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(StorybookBaseModule.withData()),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entity: todoEntity, columns: defaultColumns },
        },
        {
          provide: MatDialogRef,
          useValue: { backdropClick: () => NEVER, afterClosed: () => NEVER },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<TodoDetailsComponent> = (
  args: TodoDetailsComponent,
) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
