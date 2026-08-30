import SignUpScreen from '@/components/signUpScreen';
import { useRouter } from 'expo-router';

export default function SignupRoute() {
  const router = useRouter();

  const handleNavigate = (screen: 'login') => {
    router.push(`/(auth)/${screen}`);
  };

  return <SignUpScreen onNavigate={handleNavigate} />;
}
