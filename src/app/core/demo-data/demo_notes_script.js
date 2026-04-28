const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Configuration
const COUCHDB_URL = "https://INSTANCE_URL/db/couchdb/app/_bulk_docs";
const AUTH = Buffer.from("aam-admin:PASSWORD").toString("base64");
const TOTAL_CHILDREN = 10000;
const NOTES_PER_CHILD = 100;
const BATCH_SIZE = 1000;

async function seedData() {
  let batch = [];
  let totalProcessed = 0;

  console.log("Starting data generation...");

  for (let i = 1; i <= TOTAL_CHILDREN; i++) {
    const childId = `Child:${i}`;

    for (let j = 0; j < NOTES_PER_CHILD; j++) {
      // Create the document
      const doc = {
        _id: `Note:${uuidv4()}`,
        children: [childId],
        date: "2025-12-15",
        subject: `Test Note ${j} for Child ${i}`,
        authors: ["User:demo-admin"],
        category: "NOTE",
        warningLevel: "OK",
      };

      batch.push(doc);

      // If batch is full, send it
      if (batch.length === BATCH_SIZE) {
        await sendBatch(batch);
        totalProcessed += batch.length;
        console.log(
          `Progress: ${totalProcessed} / ${TOTAL_CHILDREN * NOTES_PER_CHILD}`,
        );
        batch = []; // Clear batch
      }
    }
  }

  // Send any remaining docs
  if (batch.length > 0) {
    await sendBatch(batch);
  }

  console.log("Seeding complete!");
}

async function sendBatch(docs) {
  try {
    await axios.post(
      COUCHDB_URL,
      { docs },
      {
        headers: {
          Authorization: `Basic ${AUTH}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "Batch failed:",
      error.response ? error.response.data : error.message,
    );
  }
}

seedData();
