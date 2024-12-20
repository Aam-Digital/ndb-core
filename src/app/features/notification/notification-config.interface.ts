/** Structure of the notification configuration object.
 * This object contains the necessary settings for Cloud Messaging integration.
 */

export interface NotificationConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
  enabled: boolean;
}
