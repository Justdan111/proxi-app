import { Redirect } from 'expo-router';

// A placeholder route so the tab bar has a real middle slot to lay out around.
// Its tab button is replaced in `_layout.tsx` by the add button, and pressing
// it is intercepted there, so this screen is never reached by a tap. The
// redirect only covers someone navigating to `/add` directly.
export default function AddTabPlaceholder() {
  return <Redirect href="/add-reminder" />;
}
