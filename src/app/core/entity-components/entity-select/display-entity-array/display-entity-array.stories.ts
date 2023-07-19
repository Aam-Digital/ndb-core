import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { Child } from "../../../../child-dev-project/children/model/child";
import { DisplayEntityArrayComponent } from "./display-entity-array.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { mockEntityMapper } from "../../../entity/mock-entity-mapper-service";
import { ChildrenService } from "../../../../child-dev-project/children/children.service";

const child1 = new Child();
child1.name = "Test Name";
child1.projectNumber = "1";
const child2 = new Child();
child2.name = "First Name";
child2.projectNumber = "2";
const child3 = new Child();
child3.name = "Second Name";
child3.projectNumber = "3";
const child4 = new Child();
child4.name = "Third Name";
child4.projectNumber = "4";
const child5 = new Child();
child5.name = "Fifth Name";
child5.projectNumber = "5";

export default {
  title: "Core/Entities/Display Properties/DisplayEntityArray",
  component: DisplayEntityArrayComponent,
  decorators: [
    moduleMetadata({
      imports: [StorybookBaseModule, DisplayEntityArrayComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([child1, child2, child3, child4, child5]),
        },
        { provide: ChildrenService, useValue: null },
      ],
    }),
  ],
} as Meta;

const Template: Story<DisplayEntityArrayComponent> = (
  args: DisplayEntityArrayComponent
) => ({
  component: DisplayEntityArrayComponent,
  props: args,
});

export const FewEntities = Template.bind({});
FewEntities.args = {
  value: [child1, child2].map((x) => x.getId(true)),
};

export const ManyEntities = Template.bind({});
ManyEntities.args = {
  value: [child1, child2, child3, child4, child5].map((x) => x.getId(true)),
};
