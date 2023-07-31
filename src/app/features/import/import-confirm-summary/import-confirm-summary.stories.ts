import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryFn,
} from "@storybook/angular";
import { StorybookBaseModule } from "../../../utils/storybook-base.module";
import { ImportConfirmSummaryComponent } from "./import-confirm-summary.component";
import { MatDialog } from "@angular/material/dialog";
import { ImportService } from "../import.service";
import { Component, importProvidersFrom, Input, OnInit } from "@angular/core";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";

@Component({
  selector: "app-storybook-dialog-launcher",
  template: "<button (click)='launch()'>open dialog</button>",
})
abstract class LaunchDialogComponent implements OnInit {
  /** dialog data passed in */
  @Input() data;

  /** overrides of dialog component instance inputs to easily showcase different states */
  @Input() cmpInputs: Object;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.launch();
  }

  launch(): void {
    const ref = this.dialog.open(ImportConfirmSummaryComponent, {
      data: this.data,
    });

    for (const input in this.cmpInputs) {
      ref.componentInstance[input] = this.cmpInputs[input];
    }
  }
}

export default {
  title: "Features/Import/5 Summary & Executing Import",
  component: LaunchDialogComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(StorybookBaseModule)],
    }),
    moduleMetadata({
      providers: [
        ImportService,
        {
          provide: EntityMapperService,
          useValue: {
            saveAll: async () => {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            },
          },
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<LaunchDialogComponent> = (
  args: LaunchDialogComponent,
) => ({
  props: args,
});

export const Confirm = Template.bind({});
Confirm.args = {
  data: {
    entitiesToImport: [],
  },
};

export const Processing = Template.bind({});
Processing.args = {
  data: {
    entitiesToImport: [],
  },
  cmpInputs: { importInProgress: true },
};
