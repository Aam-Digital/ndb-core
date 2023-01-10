import { moduleMetadata } from "@storybook/angular";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { TodosModule } from "../../todos.module";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { TodoCompletionComponent } from "./todo-completion.component";
import { Todo } from "../../model/todo";

export default {
  title: "Features/Todos/TodoCompletion",
  component: TodoCompletionComponent,
  decorators: [
    moduleMetadata({
      imports: [TodosModule, StorybookBaseModule],
    }),
  ],
} as Meta;

const Template: Story<TodoCompletionComponent> = (
  args: TodoCompletionComponent
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
