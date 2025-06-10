import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ConversationScreen from './src/screens/ConversationScreen';
import { RootStackParamList } from './src/types/navigation';
import './global.css';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#F9F0E4',
    card: '#F9F0E4',
    text: '#222',
    border: '#E5E5E5',
    primary: '#222',
  },
  fontFamily: 'monospace',
};

export default function App() {
  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: '#F9F0E4', fontFamily: 'monospace' }] }>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#F9F0E4',
            },
            headerTintColor: '#222',
            headerTitleStyle: {
              fontWeight: '600',
              fontFamily: 'monospace',
            },
            contentStyle: {
              backgroundColor: '#F9F0E4',
              fontFamily: 'monospace',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'Maya',
              headerTitleStyle: { fontFamily: 'monospace' },
            }}
          />
          <Stack.Screen 
            name="Conversation" 
            component={ConversationScreen}
            options={{
              title: 'Conversation',
              headerTitleStyle: { fontFamily: 'monospace' },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F0E4',
    fontFamily: 'monospace',
  },
});
