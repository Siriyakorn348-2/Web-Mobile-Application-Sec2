import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useRouter } from "expo-router";

export default function ScanQR() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [permission, setPermission] = useState(null);

  const askForCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setPermission(status === "granted");
  };

  if (permission === null) {
    askForCameraPermission();
  }

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    alert(`QR Code Scanned: ${data}`);
    router.push(`/registerCourse?cid=${data}`);
  };

  return (
    <View style={styles.container}>
      <BarCodeScanner onBarCodeScanned={scanned ? undefined : handleBarCodeScanned} style={{ flex: 1 }} />
      <Button title="Scan Again" onPress={() => setScanned(false)} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center" } });
