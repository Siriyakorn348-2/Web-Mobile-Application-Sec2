import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView, Button, FlatList } from "react-native";
import { getDoc, doc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    setLoading(true);

    if (auth.currentUser) {
      console.log("✅ พบผู้ใช้ล็อกอินอยู่:", auth.currentUser.uid);
      const userRef = doc(db, "users", auth.currentUser.uid);

      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          setUserInfo(docSnap.data());
          loadUserClassrooms(auth.currentUser.uid);
        } else {
          console.warn("ไม่พบข้อมูลผู้ใช้ใน Firestore");
        }
        setLoading(false);
      }).catch((error) => {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
        setLoading(false);
      });
    } else {
      console.log("ยังไม่มีข้อมูลผู้ใช้");
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("✅ ผู้ใช้ล็อกอินอยู่ (จาก onAuthStateChanged):", user.uid);
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserInfo(docSnap.data());
          loadUserClassrooms(user.uid);
        } else {
          console.warn("⚠️ ไม่พบข้อมูลผู้ใช้ใน Firestore");
        }
      } else {
        console.log("ผู้ใช้ยังไม่ได้ล็อกอิน! กำลังเปลี่ยนหน้าไป Login...");
        navigation.replace("Login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserClassrooms = async (userId) => {
    try {
      const classroomCollection = collection(db, "classroom");
      const classroomSnapshot = await getDocs(classroomCollection);

      const userClassrooms = [];
      classroomSnapshot.forEach((classroomDoc) => {
        const studentRef = doc(db, `classroom/${classroomDoc.id}/students/${userId}`);
        getDoc(studentRef).then((studentSnap) => {
          if (studentSnap.exists()) {
            userClassrooms.push({
              cid: classroomDoc.id,
              ...classroomDoc.data(),
            });
            setClassrooms([...userClassrooms]);
          }
        });
      });
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการโหลดห้องเรียน:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการล็อกเอาต์:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="large" color="#A68AC4" />
        ) : userInfo ? (
          <>
            <Text style={styles.title}>👋 สวัสดี, {userInfo.name}!</Text>
            <Text style={styles.email}>📧 {userInfo.email}</Text>
            <Button title="เข้าร่วมห้องเรียน" onPress={() => navigation.navigate("JoinClassScreen")} color="#5A67D8" />
            <FlatList
              data={classrooms}
              keyExtractor={(item) => item.cid}
              renderItem={({ item }) => (
                <View style={styles.classCard}>
                  <Text style={styles.className}>{item.info.name} ({item.info.code})</Text>
                  <Text style={styles.roomName}>📍 ห้อง: {item.info.room}</Text>
                </View>
              )}
            />
            <Button title="Logout" onPress={handleLogout} color="#D9534F" />
          </>
        ) : (
          <Text style={styles.loadingText}>⏳ กำลังโหลดข้อมูล...</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: "85%",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#A68AC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7A5ACF",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#6A6A6A",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6A6A6A",
  },
  classCard: {
    backgroundColor: "#EDEAFF",
    padding: 10,
    borderRadius: 10,
    marginVertical: 8,
    width: "100%",
  },
  className: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5A67D8",
  },
  roomName: {
    fontSize: 14,
    color: "#4A4A4A",
  },
});

export default HomeScreen;
