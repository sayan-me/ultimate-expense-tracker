import * as functions from "firebase-functions";

export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({
    message: "Hello from Firebase Functions!",
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});