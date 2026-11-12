import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Award, User } from 'lucide-react-native';
import { AppTabParamList } from './types';
import { colors } from '../theme/colors';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { PortfolioScreen } from '../screens/portfolio/PortfolioScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

export interface AppTabsProps {
  onNavigateToCreatePost: () => void;
  onNavigateToStaffQueue: () => void;
  onNavigateToUserProfile: (userId: number) => void;
}

export function AppTabs({
  onNavigateToCreatePost,
  onNavigateToStaffQueue,
  onNavigateToUserProfile,
}: AppTabsProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      >
        {({ navigation }) => (
          <HomeScreen
            onNavigateToCreatePost={onNavigateToCreatePost}
            onNavigateToCreatePortfolio={() => navigation.navigate('PortfolioTab')}
            onNavigateToPortfolioTab={() => navigation.navigate('PortfolioTab')}
            onNavigateToStaffQueue={onNavigateToStaffQueue}
            onNavigateToUserProfile={onNavigateToUserProfile}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="ExploreTab"
        options={{
          tabBarLabel: 'Jelajah',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      >
        {() => <ExploreScreen onNavigateToUserProfile={onNavigateToUserProfile} />}
      </Tab.Screen>

      <Tab.Screen
        name="PortfolioTab"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Portofolio',
          tabBarIcon: ({ color, size }) => <Award color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      >
        {() => <ProfileScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
