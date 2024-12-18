export const firebaseConfig = {
  apiKey: "<ApiKey>",
  authDomain: "<AuthDomain>",
  projectId: "<ProjectId>",
  storageBucket: "<StorageBucket>",
  messagingSenderId: "<MessageId>",
  appId: "<AppId>",
  vapidKey: "<vapidKey>",
};

// Attach config to the global `window` object
(window as any).firebaseConfig = firebaseConfig;
