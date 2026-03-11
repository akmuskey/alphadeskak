import { useState, useCallback } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import AlphaDesk from '@/components/AlphaDesk';

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);

  if (!loaded) {
    return <LoadingScreen onComplete={handleComplete} />;
  }

  return <AlphaDesk />;
};

export default Index;
