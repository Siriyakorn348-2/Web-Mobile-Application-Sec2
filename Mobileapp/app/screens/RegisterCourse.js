import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { db, auth } from "../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterCourse() {
  const [cid, setCid] = useState("");
  const [stdId, setStdId] = useState("");
  const [name, setName] = useState("");

  const registerStudent = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !cid) return alert("Missing data");

    await setDoc(doc(db, `classroom/${cid}/students/${uid}`), { stdid: stdId, name: name });
    await setDoc(doc(db, `users/${uid}/classroom/${cid}`), { status: 2 });

    alert("Registration Successful");
  };

  return (
    <View style={styles.container}>
      <Text>Enter Course ID (CID)</Text>
      <TextInput style={styles.input} value={cid} onChangeText={setCid} />
      <Text>Enter Student ID</Text>
      <TextInput style={styles.input} value={stdId} onChangeText={setStdId} />
      <Text>Enter Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Button title="Register" onPress={registerStudent} />
    </View>
  );
}
