import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen} from './screens/HomeScreen';
// import {TranscriptionScreen} from './screens/TranscriptionScreen';
import {FileText, Home} from 'react-native-feather';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    // <NavigationContainer>
    //   <Tab.Navigator
    //     screenOptions={{
    //       headerTitleAlign: 'center',
    //       headerTitle: 'Practice Your English Pronunciation',
    //       headerStyle: {backgroundColor: '#575050'},
    //       headerTitleStyle: {color: '#ffffff', fontFamily: 'serif'},
    //       headerBackgroundContainerStyle: {backgroundColor: 'red'},
    //       tabBarActiveTintColor: 'white',
    //       tabBarInactiveTintColor: '#20380a',
    //       tabBarActiveBackgroundColor: '#33252d',
    //       tabBarInactiveBackgroundColor: '#c0bdbd',
    //       tabBarShowLabel: true,
    //       tabBarLabelStyle: {fontSize: 14, fontWeight: '600'},
    //       tabBarStyle: {borderWidth: 2, borderColor: 'gray'},
    //     }}>
    //     <Tab.Screen
    //       name="HomeScreen"
    //       component={HomeScreen}
    //       options={{
    //         title: 'Home',
    //         tabBarIcon: () => (
    //           <Home stroke="black" fill="#ffff" width={32} height={32} />
    //         ),
    //       }}
    //     />
    //     {/*<Tab.Screen*/}
    //     {/*  name="TranscriptionScreen"*/}
    //     {/*  component={TranscriptionScreen}*/}
    //     {/*  options={{*/}
    //     {/*    title: 'Transcriptions',*/}
    //     {/*    tabBarIcon: () => (*/}
    //     {/*      <FileText stroke="black" fill="#ffff" width={32} height={32} />*/}
    //     {/*    ),*/}
    //     {/*  }}*/}
    //     {/*/>*/}
    //   </Tab.Navigator>
    // </NavigationContainer>
    HomeScreen()
  );
};
export default App;
