import { applicationConfig, Meta, StoryFn, StoryObj } from "@storybook/angular";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { TodoCompletionComponent } from "./todo-completion.component";
import { Todo } from "../../model/todo";
import { importProvidersFrom } from "@angular/core";

export default {
  title: "Features/Todos/TodoCompletion",
  component: TodoCompletionComponent,
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

export const Complete: StoryObj<TodoCompletionComponent> = {
  args: {
    entity: testEntity2,
  },
};
