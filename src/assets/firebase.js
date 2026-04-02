import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';


const app = firebase.initializeApp({
  apiKey: "AIzaSyCEBgqJJICIFoV2ODsPIkMnxAyN_H4XoLI",
  authDomain: "sedabgcdisplay.firebaseapp.com",
  projectId: "sedabgcdisplay",
  storageBucket: "sedabgcdisplay.firebasestorage.app",
  messagingSenderId: "721759436489",
  appId: "1:721759436489:web:d341315c65492f43e15718",
  measurementId: "G-7732FKE00C"
})

export const auth = app.auth();
export const firestore = app.firestore();
export const storage = app.storage();

export default app