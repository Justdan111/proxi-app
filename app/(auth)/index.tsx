import { useRouter, Href } from 'expo-router';
import WelcomeScreen from '@/components/welcomeScreen';

export default function WelcomeRoute() {
  const router = useRouter();

  const handleNavigate = (screen: 'signup' | 'login') => {
    router.push(`/(auth)/${screen}` as Href);
  };

  return <WelcomeScreen onNavigate={handleNavigate} />;
}
