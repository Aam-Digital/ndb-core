import { Story, Meta } from "@storybook/angular/types-6-0";
import { moduleMetadata } from "@storybook/angular";
import { RouterTestingModule } from "@angular/router/testing";
import { CommonModule } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { PreviousSchoolsComponent } from "./previous-schools.component";
import { EntitySubrecordModule } from "../../core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildSchoolRelation } from "../children/model/childSchoolRelation";
import { School } from "../schools/model/school";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SchoolsModule } from "../schools/schools.module";
import { Child } from "../children/model/child";
import { PouchDatabase } from "../../core/database/pouch-database";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { Database } from "../../core/database/database";
import { ChildrenModule } from "../children/children.module";
import { SessionService } from "../../core/session/session-service/session.service";
import { LocalSession } from "../../core/session/session-service/local-session";

const database = PouchDatabase.createWithInMemoryDB();
const schemaService = new EntitySchemaService();
const entityMapper = new EntityMapperService(database, schemaService);
const sessionService = new LocalSession(database);

const child = new Child("testChild");
const school1 = new School("1");
school1.name = "School 1";
const school2 = new School("2");
school2.name = "School 2";
const rel1 = new ChildSchoolRelation("1");
rel1.childId = child.getId();
rel1.schoolId = school1.getId();
rel1.schoolClass = "3";
rel1.start = new Date();
const rel2 = new ChildSchoolRelation("2");
rel2.childId = child.getId();
rel2.schoolId = school2.getId();
rel2.schoolClass = "2";
rel2.start = new Date();
rel2.end = new Date();
rel2.result = 80;
const rel3 = new ChildSchoolRelation("3");
rel3.childId = child.getId();
rel3.schoolId = school1.getId();
rel3.schoolClass = "1";
rel3.start = new Date();
rel3.end = new Date();
rel3.result = 23;

entityMapper.save(school1, true);
entityMapper.save(school2, true);
entityMapper.save(rel1, true);
entityMapper.save(rel2, true);
entityMapper.save(rel3, true);

export default {
  title: "child-dev-project/Previous Schools",
  component: PreviousSchoolsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        RouterTestingModule,
        EntitySubrecordModule,
        CommonModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatTooltipModule,
        SchoolsModule,
        ChildrenModule,
      ],
      declarations: [],
      providers: [
        { provide: Database, useValue: database },
        { provide: EntitySchemaService, useValue: schemaService },
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: SessionService, useValue: sessionService },
      ],
    }),
  ],
} as Meta;

const Template: Story<PreviousSchoolsComponent> = (
  args: PreviousSchoolsComponent
) => ({
  component: PreviousSchoolsComponent,
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  child: child,
};
