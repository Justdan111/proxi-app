import LogInScreen from '@/components/loginScreen';
import { useRouter } from 'expo-router';

export default function LoginRoute() {
  const router = useRouter();

  const handleNavigate = (screen: 'signup' | 'forgot-password') => {
    router.push(`/(auth)/${screen}`);
  };

  return <LogInScreen onNavigate={handleNavigate} />;
}
