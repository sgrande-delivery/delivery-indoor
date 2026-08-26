import React, { PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { getFirebaseMessaging, initialize as firebaseInitialize } from 'src/config/FirebaseConfig';
import { api } from 'src/services/api';

type FirebaseContextValue = {
  getTokenFirebaseMessaging(): void;
  requestPermissionMessaging(): void;
  fmHasToken: boolean;
};

const FirebaseContext = React.createContext<FirebaseContextValue>({} as FirebaseContextValue);

export function useFirebase(): FirebaseContextValue {
  const context = useContext(FirebaseContext);
  return context;
}

const FirebaseProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [fmHasToken, setFmHasToken] = useState(false);

  const getTokenFirebaseMessaging = useCallback(() => {
    try {
      const firebaseMessaging = getFirebaseMessaging();
      firebaseMessaging
        .getToken()
        .then(token => {
          if (token) {
            setFmHasToken(true);

            const param = {
              token,
              device: navigator.platform,
              type: 'client',
            };

            api.post('/push-tokens', param).catch(err => {
              console.log(err);
            });
          }
        })
        .catch(e => {
          console.log(e);
        });
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (process.browser) firebaseInitialize();
  }, []);

  const requestPermissionMessaging = useCallback(() => {
    try {
      const firebaseMessaging = getFirebaseMessaging();
      Notification.requestPermission()
        .then(async () => {
          const token = await firebaseMessaging.getToken();
          setFmHasToken(true);
          const param = {
            token,
            device: navigator.platform,
            type: 'client',
          };

          api.post('/push-tokens', param).catch(err => {
            console.log(err);
          });
        })
        .catch(error => {
          console.log(error);
        });
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <FirebaseContext.Provider value={{ getTokenFirebaseMessaging, requestPermissionMessaging, fmHasToken }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseProvider;
