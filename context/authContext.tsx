import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      // console.log("(AuthContext)Firebase User:", firebaseUser);
      if (firebaseUser) {
        setUser({
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
          name: firebaseUser?.displayName,
        });

        //update user data to include name
        updateUserData(firebaseUser?.uid);

        router.replace("/(tabs)");
      } else {
        //no user
        setUser(null);
        router.replace("/(auth)/welcome");
      }
      // console.log("User:", user);
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    console.log("(authContext)User:", user);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("Login error:", msg);
      if (msg.includes("user-not-found")) {
        msg = "User not found";
      } else if (msg.includes("wrong-password")) {
        msg = "Wrong password";
      } else if (msg.includes("invalid-email")) {
        msg = "Invalid email";
      } else if (msg.includes("invalid-login-credentials")) {
        msg = "Wrong email or password";
      }
      return { success: false, msg };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      let userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await setDoc(doc(firestore, "users", userCredential?.user?.uid), {
        name,
        email,
        uid: userCredential?.user?.uid,
      });
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      console.log("Register error:", msg);
      if (msg.includes("email-already-in-use")) {
        msg = "Email already in use";
      } else if (msg.includes("invalid-email")) {
        msg = "Invalid email";
      } else if (msg.includes("weak-password")) {
        msg = "Password should be at least 6 characters";
      }
      return { success: false, msg };
    }
  };

  const updateUserData = async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData: UserType = {
          name: data.name || null,
          email: data.email || null,
          uid: data.uid || null,
          image: data.image || null,
        };
        setUser({ ...userData });
      } else {
        console.log("No such document!");
      }
      // const docRef = doc(firestore, "users", uid);
    } catch (error: any) {
      let msg = error.message;
      //   return { success: false, msg };
      console.log("Error updating user data: ", msg);
    }
  };

  const contextValue = {
    user,
    setUser,
    login,
    register,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
