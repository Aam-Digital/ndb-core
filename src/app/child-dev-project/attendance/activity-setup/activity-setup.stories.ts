import { Story, Meta } from "@storybook/angular/types-6-0";
import { DemoChildGenerator } from "../../children/demo-data-generators/demo-child-generator.service";
import { addDefaultChildPhoto } from "../../../../../.storybook/utils/addDefaultChildPhoto";
import { moduleMetadata } from "@storybook/angular";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { ActivitySetupComponent } from "./activity-setup.component";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatNativeDateModule } from "@angular/material/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import { MatStepperModule } from "@angular/material/stepper";
import { ChildrenService } from "../../children/children.service";
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { AttendanceService } from "../attendance.service";
import moment from "moment";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";
import { EntityModule } from "../../../core/entity/entity.module";
import { DatabaseIndexingService } from "../../../core/entity/database-indexing/database-indexing.service";
import { ChildPhotoService } from "../../children/child-photo-service/child-photo.service";
import { MatCardModule } from "@angular/material/card";
import { Note } from "../../notes/model/note";
import { ActivityCardComponent } from "../activity-card/activity-card.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeIconsModule } from "../../../core/icons/font-awesome-icons.module";
import { DemoActivityGeneratorService } from "../demo-activity-generator.service";

const demoEvents: Note[] = [
  Note.create(new Date(), "Class 5a Parents Meeting"),
  Note.create(new Date(), "Class 6b Parents Meeting"),
  Note.create(new Date(), "Class 7c Parents Meeting"),
  Note.create(moment().subtract(1, "days").toDate(), "Discussion on values"),
  Note.create(new Date(), "Other Discussion"),
];

const demoEvent = Note.create(new Date(), "coaching");
const demoChildren = [
  DemoChildGenerator.generateEntity("1"),
  DemoChildGenerator.generateEntity("2"),
  DemoChildGenerator.generateEntity("3"),
];
demoChildren.forEach((c) => addDefaultChildPhoto(c));
demoChildren.forEach((c) => demoEvent.addChild(c.getId()));
const demoActivities = [
  DemoActivityGeneratorService.generateActivityForChildren(demoChildren),
  DemoActivityGeneratorService.generateActivityForChildren(demoChildren),
];

export default {
  title: "Child Dev Project/Views/EventSetup",
  component: ActivitySetupComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatInputModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatStepperModule,
        MatSelectModule,
        MatIconModule,
        MatListModule,
        MatCardModule,
        MatTooltipModule,
        FontAwesomeIconsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        EntityModule,
      ],
      declarations: [ActivityCardComponent],
      providers: [
        ChildrenService,
        AttendanceService,
        {
          provide: Database,
          useValue: MockDatabase.createWithData([
            ...demoChildren,
            ...demoEvents,
            ...demoActivities,
          ]),
        },
        DatabaseIndexingService,
        ChildPhotoService,
      ],
    }),
  ],
} as Meta;

const Template: Story<ActivitySetupComponent> = (
  args: ActivitySetupComponent
) => ({
  component: ActivitySetupComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {};
