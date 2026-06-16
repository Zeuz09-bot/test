import { Tabs } from 'expo-router';
import { useTaskStore } from '../../src/stores/taskStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useGoalStore } from '../../src/stores/goalStore';
import { useReviewStore } from '../../src/stores/reviewStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  // We can load data here if needed, but stores will load on demand
  return (
    <Tabs
      listenerMode="back"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#222',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { backgroundColor: '#fff', height: 64 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Briefing',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          tabBarLabel: 'Planner',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="flag-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          tabBarLabel: 'Review',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}