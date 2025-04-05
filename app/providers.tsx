"use client";

import { PropsWithChildren, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apollo-client";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { setProfile, clearProfile } from "@/store/slices/userSlice";

// A component to sync auth state with Redux
function AuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Update Redux store with session data
      store.dispatch(
        setProfile({
          id: session.user.id,
          name: session.user.name || null,
          email: session.user.email || null,
          image: session.user.image || null,
          role: session.user.role,
        })
      );
    } else if (status === "unauthenticated") {
      // Clear the user profile when not authenticated
      store.dispatch(clearProfile());
    }
  }, [session, status]);

  return null;
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ApolloProvider client={client}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AuthSync />
              {children}
              <Toaster />
            </ThemeProvider>
          </ApolloProvider>
        </PersistGate>
      </ReduxProvider>
    </SessionProvider>
  );
}
