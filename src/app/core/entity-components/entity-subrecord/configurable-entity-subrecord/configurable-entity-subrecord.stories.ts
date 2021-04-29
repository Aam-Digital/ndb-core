import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { MatNativeDateModule } from "@angular/material/core";
import { Angulartics2Module } from "angulartics2";
import { ConfigurableEntitySubrecordComponent } from "./configurable-entity-subrecord.component";
import { EntitySubrecordModule } from "../entity-subrecord.module";
import { FontAwesomeIconsModule } from "../../../icons/font-awesome-icons.module";
import { EntityMapperService } from "../../../entity/entity-mapper.service";

export default {
  title: "Core/EntityComponents/ConfigurableEntitySubrecord",
  component: ConfigurableEntitySubrecordComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntitySubrecordModule,
        FontAwesomeIconsModule,
        RouterTestingModule,
        MatNativeDateModule,
        Angulartics2Module.forRoot(),
      ],
      declarations: [],
      providers: [
        {
          provide: EntityMapperService,
          useValue: { save: () => Promise.resolve() },
        },
      ],
    }),
  ],
} as Meta;

const Template: Story<ConfigurableEntitySubrecordComponent> = (
  args: ConfigurableEntitySubrecordComponent
) => ({
  component: ConfigurableEntitySubrecordComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
