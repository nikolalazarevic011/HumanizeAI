// No need to import React with new JSX transform
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HumanizeApp } from '@/components/HumanizeApp';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <HumanizeApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;