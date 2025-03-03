import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./app/screens/LoginScreen";
import HomeScreen from "./app/screens/HomeScreen";
import RegisterScreen from "./app/screens/RegisterScreen";
import JoinClassScreen from "./app/screens/JoinClassScreen";
import ClassroomPage from "./app/screens/ClassroomPage";
import StudentQAPage from "./app/screens/StudentQAPage";


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="JoinClassScreen" component={JoinClassScreen} />
        <Stack.Screen name="ClassroomPage" component={ClassroomPage} />
        <Stack.Screen name="StudentQAPage" component={StudentQAPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
