

import SignUpScreen from '@/components/signUpScreen';
import { useRouter, Href } from 'expo-router';


export default function SignupRoute() {
  const router = useRouter();

  const handleNavigate = (screen: 'welcome' | 'login') => {
    router.push((screen === 'welcome' ? '/(auth)' : `/(auth)/${screen}`) as Href);
  };

  return <SignUpScreen onNavigate={handleNavigate} />;
}
