import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";

// config for each project
var firebaseConfig = {
  apiKey: "AIzaSyC07VNK5to4h2iQUrEHZutjEry9PrDVzf8",
  authDomain: "think-piece-76b6c.firebaseapp.com",
  databaseURL: "https://think-piece-76b6c.firebaseio.com",
  projectId: "think-piece-76b6c",
  storageBucket: "think-piece-76b6c.appspot.com",
  messagingSenderId: "114444747470",
  appId: "1:114444747470:web:90e695f24904bbc916c69f",
  measurementId: "G-TRX1ZYY1YS"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// firebase.analytics();

// exported consts and function
export const firestore = firebase.firestore();
export const auth = firebase.auth();
export const storage = firebase.storage();
export const signOut = () => auth.signOut();
export const signIn = (email, password) =>
  auth.signInWithEmailAndPassword(email, password);
export const provider = new firebase.auth.GoogleAuthProvider();
export const signInWithGooogle = () => auth.signInWithPopup(provider);

window.firebase = firebase; // for development purposes and testing

export const createUserProfileDocument = async (user, additionalData) => {
  if (!user) return;

  // Get a reference to the place in the database where a user profile might be.
  const userRef = firestore.doc(`users/${user.uid}`);

  // Go and fetch the document from that location.
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date();
    try {
      await userRef.set({
        displayName,
        email,
        photoURL,
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error("Error creating user", error.message);
    }
  }

  return getUserDocument(user.uid);
};

export const getUserDocument = async uid => {
  if (!uid) return null;
  try {
    return firestore.collection("users").doc(uid);
  } catch (error) {
    console.error("Error fetching user", error.message);
  }
};

export default firebase;
