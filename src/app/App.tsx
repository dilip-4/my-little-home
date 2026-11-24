import { lazy, Suspense, useEffect, useState } from 'react';
import { GameShell } from './GameShell';

const CharacterSheet = lazy(() => import('./CharacterSheet'));

export function App() {
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  if (hash === '#sheet')
    return (
      <Suspense fallback={null}>
        <CharacterSheet />
      </Suspense>
    );
  return <GameShell />;
}
