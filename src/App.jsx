import AppRouter from './routes/AppRouter.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';

/**
 * KnowASport — Root Application
 */
export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppRouter />
      </LocationProvider>
    </AuthProvider>
  );
}
