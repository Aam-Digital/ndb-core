import { DemoNoteGeneratorService } from "../../../../child-dev-project/notes/demo-data/demo-note-generator.service";
import { DemoChildGenerator } from "../../../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoUserGeneratorService } from "../../../user/demo-user-generator.service";

const childGenerator = new DemoChildGenerator({ count: 10 });
const userGenerator = new DemoUserGeneratorService();
const data = new DemoNoteGeneratorService(
  { minNotesPerChild: 5, maxNotesPerChild: 10, groupNotes: 2 },
  childGenerator,
  userGenerator,
).generateEntities();

export default { title: "EntitySubrecord" };

// TODO: fix stories for EntitySubrecord
/*
export default {
  title: "Core/Entities/EntitySubrecord",
  component: EntitySubrecordComponent,
  decorators: [
    moduleMetadata({
      imports: [
        EntitySubrecordComponent,
        StorybookBaseModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: EntityMapperService,
          useValue: {
            save: () => Promise.resolve(),
            remove: () => Promise.resolve(),
            load: () =>
              Promise.resolve(
                faker.helpers.arrayElement(childGenerator.entities)
              ),
            loadType: () => Promise.resolve(childGenerator.entities),
            receiveUpdates: () => NEVER,
          },
        },
        { provide: EntitySchemaService, useValue: schemaService },
        DatePipe,
        {
          provide: ChildrenService,
          useValue: {
            getChild: () =>
              of(faker.helpers.arrayElement(childGenerator.entities)),
          },
        },
        {
          provide: AbilityService,
          useValue: { abilityUpdated: new Subject() },
        },

        {
          provide: EntityAbility,
          useValue: new Ability([{ subject: "all", action: "manage" }]),
        },
      ],
    }),
  ],
} as Meta;

const Template: StoryFn<EntitySubrecordComponent<Note>> = (
  args: EntitySubrecordComponent<Note>
) => {
  EntitySubrecordComponent.prototype.newRecordFactory = () => new Note();
  return {
    component: EntitySubrecordComponent,
    props: args,
  };
};

export const Primary = Template.bind({});
Primary.args = {
  columns: <FormFieldConfig[]>[
    { id: "date" },
    { id: "subject" },
    { id: "category" },
    { id: "children" },
  ],
  records: data,
};

export const WithAttendance = Template.bind({});
WithAttendance.args = {
  columns: <FormFieldConfig[]>[
    { id: "date" },
    { id: "subject" },
    { id: "category" },
    { id: "children" },
    {
      id: "present",
      label: "Present",
      view: "NoteAttendanceCountBlock",
      additional: { status: AttendanceLogicalStatus.PRESENT },
      noSorting: true,
    },
    {
      id: "absent",
      label: "Absent",
      view: "NoteAttendanceCountBlock",
      additional: { status: AttendanceLogicalStatus.ABSENT },
      noSorting: true,
    },
  ],
  records: data,
};
*/
