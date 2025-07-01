import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { EditTodoCompletionComponent } from "./edit-todo-completion.component";
import { Todo } from "../../model/todo";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Todos/TodoCompletion",
  component: EditTodoCompletionComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta;

const testEntity = new Todo();
testEntity.subject = "test";

export const Incomplete = {
  args: {
    entity: testEntity,
  },
};

const testEntity2 = new Todo();
testEntity2.subject = "test";
testEntity2.completed = { completedBy: "tester", completedAt: new Date() };

export const Complete: StoryObj<EditTodoCompletionComponent> = {
  args: {
    entity: testEntity2,
  },
};
