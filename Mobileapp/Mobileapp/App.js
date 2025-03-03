import { StatusBar} from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCodeScanner from "./components/QRCodeScanner";
import ScannerScreen from "./components/ScannerScreen";

import Login from "./components/Login";

export default function App() {
    return <ScannerScreen />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "##FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
});