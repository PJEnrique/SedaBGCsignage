import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCEBgqJJICIFoV2ODsPIkMnxAyN_H4XoLI",
  authDomain: "sedabgcdisplay.firebaseapp.com",
  projectId: "sedabgcdisplay",
  storageBucket: "sedabgcdisplay.firebasestorage.app",
  messagingSenderId: "721759436489",
  appId: "1:721759436489:web:d341315c65492f43e15718",
  measurementId: "G-7732FKE00C"
};

const app = firebase.apps.length
  ? firebase.app()
  : firebase.initializeApp(firebaseConfig);

export const auth = app.auth();

export const firestore = app.firestore();

try {
  firestore.settings({
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });
} catch (error) {
  console.warn('Firestore settings already initialized:', error.message);
}

export const storage = app.storage();

export default app;