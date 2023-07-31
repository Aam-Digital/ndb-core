import { applicationConfig, Meta, StoryFn } from "@storybook/angular";
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

const Template: StoryFn<TodoCompletionComponent> = (
  args: TodoCompletionComponent,
) => ({
  component: TodoCompletionComponent,
  props: args,
});

const testEntity = new Todo();
testEntity.subject = "test";

export const Incomplete = Template.bind({});
Incomplete.args = {
  entity: testEntity,
};

const testEntity2 = new Todo();
testEntity2.subject = "test";
testEntity2.completed = { completedBy: "tester", completedAt: new Date() };

export const Complete = Template.bind({});
Complete.args = {
  entity: testEntity2,
};
