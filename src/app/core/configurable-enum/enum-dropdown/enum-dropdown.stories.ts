import { Meta, Story } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { EnumDropdownComponent } from "./enum-dropdown.component";
import { FormControl } from "@angular/forms";
import { centersUnique } from "../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { mockEntityMapper } from "../../entity/mock-entity-mapper-service";
import { ConfigurableEnum } from "../configurable-enum";
import { NEVER } from "rxjs";
import { ConfigurableEnumService } from "../configurable-enum.service";

const centerEntity = new ConfigurableEnum("center");
centerEntity.values = centersUnique;
const entityMapper = mockEntityMapper();
const enumService = new ConfigurableEnumService(entityMapper, {
  configUpdates: NEVER,
} as any);
entityMapper.add(centerEntity);
export default {
  title: "Core/EntityComponents/Entity Property Fields/Enum Dropdown",
  component: EnumDropdownComponent,
  decorators: [
    moduleMetadata({
      imports: [EnumDropdownComponent, StorybookBaseModule],
      providers: [
        {
          provide: ConfigurableEnumService,
          useValue: enumService,
        },
        {
          provide: EntityMapperService,
          useValue: entityMapper,
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<EnumDropdownComponent> = (
  args: EnumDropdownComponent
) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  form: new FormControl(""),
  label: "test field",
  enumId: "center",
};

const disabledControl = new FormControl(centersUnique[0]);
disabledControl.disable();
export const Disabled = Template.bind({});
Disabled.args = {
  form: disabledControl,
  label: "test field",
  enumId: "center",
};

export const Multi = Template.bind({});
Multi.args = {
  form: new FormControl([]),
  label: "test field",
  enumId: "center",
  multi: true,
};
