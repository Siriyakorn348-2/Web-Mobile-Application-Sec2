import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./screens/Home"; 
import LoginScreen from "./screens/Login"; 
import RegisterScreen from "./screens/Register"; 
import JoinClassScreen from "./screens/JoinClassScreen";


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="JoinClassScreen" component={JoinClassScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
