import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GraduationCap } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { RootStackParamList } from './types';
import { AppTabs } from './AppTabs';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { CreatePostScreen } from '../screens/post/CreatePostScreen';
import { ModerationQueueScreen } from '../screens/staff/ModerationQueueScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashBadge}>
          <GraduationCap size={44} color={colors.primary} />
        </View>
        <Text style={styles.splashTitle}>CampusFolio</Text>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1 }}>
        {authScreen === 'login' ? (
          <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />
        ) : (
          <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {({ navigation }) => (
            <AppTabs
              onNavigateToCreatePost={() => navigation.navigate('CreatePost')}
              onNavigateToStaffQueue={() => navigation.navigate('ModerationQueue')}
              onNavigateToUserProfile={(userId) => navigation.navigate('UserProfile', { userId })}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="CreatePost">
          {({ navigation }) => (
            <CreatePostScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ModerationQueue">
          {({ navigation }) => (
            <ModerationQueueScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen name="UserProfile">
          {({ route, navigation }) => (
            <ProfileScreen
              targetUserId={route.params?.userId}
              onBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
});
