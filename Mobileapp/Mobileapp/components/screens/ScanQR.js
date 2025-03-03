import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";

export default function ScanQR() {
  const [scanned, setScanned] = useState(false);
  const [permission, setPermission] = useState(null);

  useEffect(() => {
    const askForCameraPermission = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setPermission(status === "granted");
    };

    askForCameraPermission();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    alert(`QR Code Scanned: ${data}`);
  };

  if (permission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (permission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={{ flex: 1 }}
      />
      {scanned && <Button title="Scan Again" onPress={() => setScanned(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
