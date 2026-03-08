/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {user} from "firebase-functions/v1/auth";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

initializeApp();

setGlobalOptions({maxInstances: 10});

export const onUserCreated = user().onCreate(async (userRecord) => {
  const db = getFirestore();
  const uid = userRecord.uid;

  const userRef = db.collection("users").doc(uid);

  // Create the user document
  await userRef.set({
    uid,
    email: userRecord.email ?? null,
    accountType: null,
    caregivers: [],
    createdAt: Timestamp.now(),
  });

  // Seed an empty placeholder doc in 'calendar' to establish
  // the subcollection schema
  await userRef.collection("calendar").doc("_schema").set({
    dateTime: Timestamp.now(), // DateTime of the event
    title: "",
    notes: "",
    // add other event fields here as needed
    _placeholder: true,
  });

  // Seed an empty placeholder doc in 'medications' to establish
  // the subcollection schema
  await userRef.collection("medications").doc("_schema").set({
    rxMetadata: {
      medicationName: "",
      dosage: "",
      frequency: "",
      prescribingDoctor: "",
      pharmacy: "",
      refillsRemaining: 0,
    },
    analyticalMetadata: {
      adherenceRate: 0,
      missedDoses: 0,
      sideEffectsReported: [],
      notes: "",
    },
    prescriptionStart: Timestamp.now(),
    prescriptionEnd: Timestamp.now(),
    _placeholder: true,
  });

  console.log(`User document created for uid: ${uid}`);
});
