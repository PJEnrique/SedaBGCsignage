import React, { useContext, useEffect, useState } from "react";
import firebase from "../firebase";
import { firestore } from "../firebase";

const AuthContext = React.createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const signInWithEmailAndPassword = async (email, password) => {
    await firebase.auth().signInWithEmailAndPassword(email, password);
  };

  const signUp = async (email, password) => {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Store basic user data only
      await firestore.collection('users').doc(user.uid).set({
        email: user.email,
        uid: user.uid,
        createdAt: new Date(),
      });

      return { user };
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const signOut = () => {
    return firebase.auth().signOut();
  };

  const value = {
    currentUser,
    signInWithEmailAndPassword,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};