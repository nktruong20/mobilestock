// App.js

// 1) Patch BackHandler để tránh warning removeEventListener undefined
import { BackHandler } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import Login from './screens/Login';
import Register from './screens/Register';

// Main screens
import AccountPage from './screens/AccountPage';
import Dashboard from './screens/Dashboard';
import MarketPage from './screens/MarketPage';
import NewsPage from './screens/NewsPage';
if (typeof BackHandler.removeEventListener !== 'function') {
  BackHandler.removeEventListener = () => {};
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* Auth flow */}
        <Stack.Screen name="Login"    component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* Main flow */}
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Market"    component={MarketPage} />
        <Stack.Screen name="News"      component={NewsPage} />
        <Stack.Screen name="Account"   component={AccountPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
