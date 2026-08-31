import { Redirect } from 'expo-router';
import { useAuth } from '@/context/authContext';
import SplashScreen from '@/components/splashScreen';

// `/` had no route. Nothing in `app/` matched it, so a cold launch landed on
// expo-router's "Unmatched Route" screen instead of the app.
//
// It only bit signed-in users: RootNavigator redirects anyone signed out to
// login, but a signed-in user at `/` fell through to the Stack, which had no
// index to render. The tab group does not answer `/` on its own — a group is
// not a route.
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Still reading the stored token. Showing the splash rather than redirecting
  // avoids a flash of the login screen for someone who is already signed in.
  if (isLoading) return <SplashScreen />;

  return <Redirect href={isAuthenticated ? '/(tab)/home' : '/(auth)/login'} />;
}
