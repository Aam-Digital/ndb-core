/**
 * Object specifying overall navigation menu
 * as stored in the config database
 */
export interface NavigationMenuConfig {
  items: {
    name: string;
    icon: string;
    link: string;
  }[];
}
