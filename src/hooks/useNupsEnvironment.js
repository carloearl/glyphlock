import { useCallback, useSyncExternalStore } from 'react';
import {
  getNupsDataScope,
  getNupsEnvironment,
  getNupsEnvironmentPolicy,
  setNupsEnvironment,
  subscribeToNupsEnvironment,
} from '@/lib/nups/operatingEnvironment';

const getServerSnapshot = () => 'LIVE';

export default function useNupsEnvironment() {
  const environment = useSyncExternalStore(
    subscribeToNupsEnvironment,
    getNupsEnvironment,
    getServerSnapshot,
  );

  const setEnvironment = useCallback((next, options) => setNupsEnvironment(next, options), []);

  return {
    environment,
    policy: getNupsEnvironmentPolicy(environment),
    dataScope: getNupsDataScope({ environment }),
    setEnvironment,
    isLive: environment === 'LIVE',
    isDemo: environment === 'DEMO',
    isTraining: environment === 'TRAINING',
  };
}
