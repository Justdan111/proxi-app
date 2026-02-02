

import LogInScreen from '@/components/loginScreen';
import { useRouter, Href } from 'expo-router';


export default function LoginRoute() {
  const router = useRouter();

  const handleNavigate = (screen: 'welcome' | 'signup') => {
    router.push((screen === 'welcome' ? '/(auth)' : `/(auth)/${screen}`) as Href);
  };

  return <LogInScreen onNavigate={handleNavigate} />;
}
