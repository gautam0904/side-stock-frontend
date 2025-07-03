// src/contexts/navigation.context.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// Define the props type, including children
interface NavigationProviderProps {
  children: ReactNode; // The 'children' prop should accept any valid React node (e.g., components, JSX, etc.)
}

const NavigationContext = createContext<any>(null);

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <NavigationContext.Provider value={navigate}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook to access navigate
export const useNavigation = () => {
  const navigate = useContext(NavigationContext);
  if (!navigate) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return navigate;
};
