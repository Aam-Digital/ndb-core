import "zone.js";
import "zone.js/testing";
import "hammerjs";
import * as buffer from "buffer";

// Required by PouchDB in tests.
(window as any).global = window;
(window as any).Buffer = buffer.Buffer;
