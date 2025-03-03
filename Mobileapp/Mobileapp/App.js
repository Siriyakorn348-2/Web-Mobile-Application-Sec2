import { StatusBar} from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Login from "./components/Login";

export default function App() {
    return <Login />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "##FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
});