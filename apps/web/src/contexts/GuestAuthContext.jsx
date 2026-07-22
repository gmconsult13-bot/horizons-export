import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import pb from '@/lib/pocketbaseClient.js';

const GuestAuthContext = createContext(null);

export const GuestAuthProvider = ({ children }) => {
  const [currentGuest, setCurrentGuest] = useState(
    pb.authStore.record || pb.authStore.model || null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(
      (_token, record) => {
        setCurrentGuest(record || null);
      },
      true,
    );

    setIsLoading(false);

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const authData = await pb
        .collection('guests')
        .authWithPassword(normalizedEmail, password, {
          $autoCancel: false,
        });

      if (authData.record?.verified !== true) {
        pb.authStore.clear();

        const error = new Error(
          'Please verify your email address before logging in.',
        );

        error.code = 'EMAIL_NOT_VERIFIED';
        throw error;
      }

      return authData;
    } catch (error) {
      if (error?.code === 'EMAIL_NOT_VERIFIED') {
        throw error;
      }

      pb.authStore.clear();
      throw error;
    }
  };

  const register = async ({
    email,
    password,
    passwordConfirm,
    phone,
  }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const record = await pb.collection('guests').create(
      {
        email: normalizedEmail,
        password,
        passwordConfirm,
        phone: phone.trim(),
        emailVisibility: false,
      },
      {
        $autoCancel: false,
      },
    );

    await pb
      .collection('guests')
      .requestVerification(normalizedEmail, {
        $autoCancel: false,
      });

    return record;
  };

  const resendVerification = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    return pb
      .collection('guests')
      .requestVerification(normalizedEmail, {
        $autoCancel: false,
      });
  };

  const confirmEmailVerification = async (token) => {
    if (!token) {
      throw new Error('The verification token is missing.');
    }

    return pb.collection('guests').confirmVerification(
      token,
      {
        $autoCancel: false,
      },
    );
  };

  const requestPasswordReset = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    return pb
      .collection('guests')
      .requestPasswordReset(normalizedEmail, {
        $autoCancel: false,
      });
  };

  const confirmPasswordReset = async (
    token,
    password,
    passwordConfirm,
  ) => {
    if (!token) {
      throw new Error('The password-reset token is missing.');
    }

    return pb.collection('guests').confirmPasswordReset(
      token,
      password,
      passwordConfirm,
      {
        $autoCancel: false,
      },
    );
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentGuest(null);
  };

  const isGuestAuthenticated =
    pb.authStore.isValid &&
    currentGuest?.collectionName === 'guests' &&
    currentGuest?.verified === true;

  return (
    <GuestAuthContext.Provider
      value={{
        currentGuest,
        isGuestAuthenticated,
        isLoading,
        login,
        register,
        logout,
        resendVerification,
        requestPasswordReset,
        confirmPasswordReset,
        confirmEmailVerification,
      }}
    >
      {children}
    </GuestAuthContext.Provider>
  );
};

export const useGuestAuth = () => {
  const context = useContext(GuestAuthContext);

  if (!context) {
    throw new Error(
      'useGuestAuth must be used inside GuestAuthProvider',
    );
  }

  return context;
};