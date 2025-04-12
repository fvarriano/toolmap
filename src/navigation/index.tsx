import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Import screens (to be created)
import Dashboard from '@screens/Dashboard';
import WorkflowList from '@screens/WorkflowList';
import WorkflowDetail from '@screens/WorkflowDetail';
import Profile from '@screens/Profile';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen 
          name="Dashboard" 
          component={Dashboard}
          options={{ title: 'Dashboard' }}
        />
        <Stack.Screen 
          name="WorkflowList" 
          component={WorkflowList}
          options={{ title: 'Workflows' }}
        />
        <Stack.Screen 
          name="WorkflowDetail" 
          component={WorkflowDetail}
          options={{ title: 'Workflow Details' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={Profile}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 