import { SelectComponent } from "./select.component";
import { Meta, Story } from "@storybook/angular/types-6-0";
import { Entity } from "../../entity/entity";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";

export default {
  title: "Core/select-component",
  component: SelectComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatChipsModule,
        MatIconModule,
      ],
    }),
  ],
} as Meta;

const genericEntities: Entity[] = ["A", "B", "C"].map((e) => new Entity(e));

const Template: Story<SelectComponent<Entity>> = (
  args: SelectComponent<Entity>
) => ({
  component: SelectComponent,
  props: args,
  template: `
    <app-select>
        <mat-chip>A</mat-chip>
    </app-select>
  `,
});

export const Generic = Template.bind({});
Generic.args = {
  label: "Generic",
  removable: true,
};
