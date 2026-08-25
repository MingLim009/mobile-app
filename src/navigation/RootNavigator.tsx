import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import type {
  AuthStackParamList,
  ExtratoStackParamList,
  HomeStackParamList,
  MainTabParamList,
  PixStackParamList,
  RootStackParamList,
  SupportStackParamList,
} from './types';
import { colors } from '../theme';

import { LoginScreen } from '../screens/auth/LoginScreen';
import {
  BiometricsSetupScreen,
  RecoverPasswordScreen,
  ResetPasswordScreen,
} from '../screens/auth/AuthExtraScreens';
import { HomeScreen } from '../screens/home/HomeScreen';
import {
  ExtratoScreen,
  ReceiptScreen,
  RefundScreen,
  TransactionDetailScreen,
} from '../screens/extrato/ExtratoScreens';
import {
  ChargeResultScreen,
  ChargeScreen,
  PixHomeScreen,
  TransferMethodScreen,
} from '../screens/pix/PixHomeScreens';
import {
  CopyPasteScreen,
  FavoritesScreen,
  QrScanScreen,
  TransferAmountScreen,
  TransferByKeyScreen,
  TransferConfirmScreen,
  TransferManualScreen,
  TransferResultScreen,
} from '../screens/pix/TransferScreens';
import {
  AutoPixDetailScreen,
  AutoPixListScreen,
  KeyDetailScreen,
  KeyRegisterScreen,
  KeysListScreen,
  LimitEditScreen,
  LimitsScreen,
  ScheduledCreateScreen,
  ScheduledDetailScreen,
  ScheduledListScreen,
} from '../screens/pix/KeysLimitsScreens';
import {
  MedDetailScreen,
  MedFormScreen,
  MedIntroScreen,
  MedListScreen,
  MedResultScreen,
  MedSelectTxScreen,
  SupportHomeScreen,
} from '../screens/support/SupportScreens';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExtratoStack = createNativeStackNavigator<ExtratoStackParamList>();
const PixStack = createNativeStackNavigator<PixStackParamList>();
const SupportStack = createNativeStackNavigator<SupportStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="RecoverPassword" component={RecoverPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="BiometricsSetup" component={BiometricsSetupScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function ExtratoNavigator() {
  return (
    <ExtratoStack.Navigator screenOptions={{ headerShown: false }}>
      <ExtratoStack.Screen name="ExtratoMain" component={ExtratoScreen} />
      <ExtratoStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <ExtratoStack.Screen name="Receipt" component={ReceiptScreen} />
      <ExtratoStack.Screen name="Refund" component={RefundScreen} />
    </ExtratoStack.Navigator>
  );
}

function PixNavigator() {
  return (
    <PixStack.Navigator screenOptions={{ headerShown: false }}>
      <PixStack.Screen name="PixHome" component={PixHomeScreen} />
      <PixStack.Screen name="TransferMethod" component={TransferMethodScreen} />
      <PixStack.Screen name="TransferByKey" component={TransferByKeyScreen} />
      <PixStack.Screen name="TransferManual" component={TransferManualScreen} />
      <PixStack.Screen name="CopyPaste" component={CopyPasteScreen} />
      <PixStack.Screen name="QrScan" component={QrScanScreen} />
      <PixStack.Screen name="TransferAmount" component={TransferAmountScreen} />
      <PixStack.Screen name="TransferConfirm" component={TransferConfirmScreen} />
      <PixStack.Screen name="TransferResult" component={TransferResultScreen} />
      <PixStack.Screen name="Charge" component={ChargeScreen} />
      <PixStack.Screen name="ChargeResult" component={ChargeResultScreen} />
      <PixStack.Screen name="KeysList" component={KeysListScreen} />
      <PixStack.Screen name="KeyRegister" component={KeyRegisterScreen} />
      <PixStack.Screen name="KeyDetail" component={KeyDetailScreen} />
      <PixStack.Screen name="Limits" component={LimitsScreen} />
      <PixStack.Screen name="LimitEdit" component={LimitEditScreen} />
      <PixStack.Screen name="Favorites" component={FavoritesScreen} />
      <PixStack.Screen name="ScheduledList" component={ScheduledListScreen} />
      <PixStack.Screen name="ScheduledCreate" component={ScheduledCreateScreen} />
      <PixStack.Screen name="ScheduledDetail" component={ScheduledDetailScreen} />
      <PixStack.Screen name="AutoPixList" component={AutoPixListScreen} />
      <PixStack.Screen name="AutoPixDetail" component={AutoPixDetailScreen} />
    </PixStack.Navigator>
  );
}

function SupportNavigator() {
  return (
    <SupportStack.Navigator screenOptions={{ headerShown: false }}>
      <SupportStack.Screen name="SupportHome" component={SupportHomeScreen} />
      <SupportStack.Screen name="MedIntro" component={MedIntroScreen} />
      <SupportStack.Screen name="MedSelectTx" component={MedSelectTxScreen} />
      <SupportStack.Screen name="MedForm" component={MedFormScreen} />
      <SupportStack.Screen name="MedResult" component={MedResultScreen} />
      <SupportStack.Screen name="MedList" component={MedListScreen} />
      <SupportStack.Screen name="MedDetail" component={MedDetailScreen} />
    </SupportStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Inicio: 'home-outline',
            Extrato: 'list-outline',
            Pix: 'flash-outline',
            Suporte: 'help-circle-outline',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeNavigator} options={{ title: 'Início' }} />
      <Tab.Screen name="Extrato" component={ExtratoNavigator} />
      <Tab.Screen name="Pix" component={PixNavigator} options={{ title: 'Pix' }} />
      <Tab.Screen name="Suporte" component={SupportNavigator} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user } = useApp();

  return (
    <NavigationContainer key={user ? 'app' : 'auth'}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
