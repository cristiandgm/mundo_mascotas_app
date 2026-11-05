import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AnimatedSplashScreen } from './src/components/AnimatedSplashScreen';
import { FloatingAuthModal } from './src/components/FloatingAuthModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { colors } from './src/theme/colors';

const MainAppShell: React.FC<{ isSplashDone: boolean }> = ({ isSplashDone }) => {
  return (
    <View style={styles.container}>
      <HomeScreen />
      {isSplashDone && <FloatingAuthModal />}
    </View>
  );
};

export default function App() {
  const [isSplashDone, setIsSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <MainAppShell isSplashDone={isSplashDone} />
        {!isSplashDone && (
          <AnimatedSplashScreen onFinish={() => setIsSplashDone(true)} />
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bg,
  },
});
