import { MenuItem } from "../../ui/navigation/menu-item";

export const CONFIG_SETUP_WIZARD_ID = "Config:SetupWizard";

export interface SetupWizardConfig {
  steps: SetupWizardStep[];
}

export interface SetupWizardStep {
  title: string;
  text: string;
  actions?: MenuItem[];
}

export const defaultSetupWizardConfig: SetupWizardConfig = {
  steps: [
    {
      title: "Willkommen",
      text: `
# Herzlich willkommen bei codo!
codo hilft dir dabei ...

Die folgenden Schritten leiten dich durch die wichtigsten Einstellungen,
um codo optimal auf euer Projekt anzupassen. Du kannst schon nach wenigen
Minuten loslegen und die ersten Daten erfassen.

Du kannst jederzeit über den Button unten im Menü links zu diesen
Einrichtungsassistenten zurückkehren, wenn du zunächst die Anwendung
erkunden möchtest.`,
    },
    {
      title: "Profile & Felder anpassen",
      text: `
codo ist als Software bereits genau auf die Betreuung von Patenschaften
zugeschnitten. Unsere langjährige Erfahrungen der BürgerStiftung Hamburg
und Stiftung Bürgermut in der Betreuung solcher Projekte sind die Basis
für codo und das System wurde in enger Zusammenarbeit mit einer
Fokusgruppe von Projekten entwickelt.

Damit codo optimal auf euer Projekt passt, könnt ihr innerhalb der
vorhandenen Datenstrukturen zusätzliche Felder und Formularbereiche
individuell anpassen.`,
      actions: [
        {
          label: "Mentor:innen-Profile anpassen",
          link: "/admin/entity/School",
        },
        {
          label: "Mentee-Profile anpassen",
          link: "/admin/entity/Child",
        },
        {
          label: "Patenschafts-Daten anpassen",
          link: "/admin/entity/ChildSchoolRelation",
        },
      ],
    },
    {
      title: "Nutzer:innen hinzufügen",
      text: `
Ihr könnt in codo sehr einfach als Team zusammenarbeiten. Die Daten sind
für alle synchronisiert und auf dem aktuellsten Stand. Weitere
Nutzer-Accounts könnt ihr jederzeit selbst erstellen.`,
      actions: [
        {
          label: "Nutzer-Accounts verwalten",
          link: "/user",
        },
      ],
    },
    {
      title: "Daten importieren",
      text: `
Falls ihr bestehende Daten bisheriger Patenschaften habt, könnt ihr diese
einfach importieren. Dazu müssen diese aus Excel im ".csv"-Format
abgespeichert werden. Das Import-Modul von codo hilft euch dabei, die
Tabellen den passenden Datenfeldern zuzuordnen.`,
      actions: [
        {
          label: "Daten importieren",
          link: "/import",
        },
      ],
    },
    {
      title: "Fertig",
      text: `
Mehr gibt es eigentlich nicht zu beachten. Ihr könnt jetzt loslegen und
codo ausprobieren. Bei Fragen oder Problemen wendet euch gerne an xxx.de

Ein paar Tipps und mögliche erste Schritte zum Abschluss: ...`,
    },
  ],
};
