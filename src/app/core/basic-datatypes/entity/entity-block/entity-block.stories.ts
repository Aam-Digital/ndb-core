import { applicationConfig, Meta, StoryObj } from "@storybook/angular";
import { EntityBlockComponent } from "./entity-block.component";
import { StorybookBaseModule } from "../../../../utils/storybook-base.module";
import { importProvidersFrom } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { createEntityOfType } from "../../../demo-data/create-entity-of-type";

export default {
  title: "Core/Entities/EntityBlock",
  component: EntityBlockComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
  ],
} as Meta<EntityBlockComponent>;

const testChild = createEntityOfType("Child");
testChild.name = "Test Name";
testChild.projectNumber = "10";

export const ChildComponent: StoryObj<EntityBlockComponent> = {
  args: {
    entity: testChild,
  },
};

const testEntity = new Entity();

export const DefaultComponent: StoryObj<EntityBlockComponent> = {
  args: {
    entity: testEntity,
  },
};
