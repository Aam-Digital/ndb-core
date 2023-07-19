import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { TodoDetailsComponent } from "./todo-details.component";
import { TodosModule } from "../todos.module";
import { TodoService } from "../todo.service";
import { Todo } from "../model/todo";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { FormFieldConfig } from "../../../core/entity-components/entity-form/entity-form/FormConfig";
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
    moduleMetadata({
      imports: [TodosModule, StorybookBaseModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entity: todoEntity, columns: defaultColumns },
        },
        {
          provide: MatDialogRef,
          useValue: { backdropClick: () => NEVER, afterClosed: () => NEVER },
        },
        {
          provide: TodoService,
          useValue: {},
        },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    }),
  ],
} as Meta;

const Template: Story<TodoDetailsComponent> = (args: TodoDetailsComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
