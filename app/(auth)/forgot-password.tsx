import ForgotPasswordScreen from '@/components/forgotPasswordScreen';
import { useRouter } from 'expo-router';

export default function ForgotPasswordRoute() {
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/(auth)/login');
  };

  return <ForgotPasswordScreen onNavigate={handleNavigate} />;
}
