import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = useRef(false);
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    // Check active session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        // Don't restore session if user explicitly logged out
        if (hasLoggedOut.current) {
          setLoading(false);
          return;
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        // Don't restore session if user explicitly logged out or is in demo mode
        if (hasLoggedOut.current || (isDemoMode.current && !session?.user)) {
          return;
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    });

    // Handle tab visibility change - refresh session when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // Don't refresh if user logged out or is in demo mode
        if (hasLoggedOut.current || isDemoMode.current) {
          return;
        }
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;

          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error(
            "Error refreshing session on visibility change:",
            error
          );
        } finally {
          setLoading(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          station:stations(*)
        `
        )
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    // Reset logout flag when signing in
    hasLoggedOut.current = false;

    // Demo login credentials - check first for instant login without network
    const isDemoCredentials =
      (email === "admin@resq.com" || email === "admin") &&
      password === "admin123";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If Supabase auth succeeds, return the result
      if (!error && data?.user) {
        isDemoMode.current = false;
        return { data, error: null };
      }

      // If Supabase failed but demo credentials were used, allow demo login
      if (isDemoCredentials) {
        console.log("Supabase auth failed, using demo login mode");
        isDemoMode.current = true;
        const demoUser = {
          id: "demo-user-id",
          email: "admin@resq.com",
          user_metadata: { name: "Demo Admin" },
        };
        setUser(demoUser);
        setProfile({
          id: "demo-user-id",
          email: "admin@resq.com",
          full_name: "Demo Admin",
          role: "admin",
          station: { name: "Main Station", address: "Cagayan de Oro City" },
        });
        setLoading(false);
        return { data: { user: demoUser }, error: null };
      }

      // Return the Supabase error for non-demo credentials
      return { data, error: error || new Error("Invalid credentials") };
    } catch (err) {
      console.error("Sign in error:", err);

      // Fallback demo login if Supabase is completely unavailable
      if (isDemoCredentials) {
        console.log("Using demo login mode (fallback)");
        isDemoMode.current = true;
        const demoUser = {
          id: "demo-user-id",
          email: "admin@resq.com",
          user_metadata: { name: "Demo Admin" },
        };
        setUser(demoUser);
        setProfile({
          id: "demo-user-id",
          email: "admin@resq.com",
          full_name: "Demo Admin",
          role: "admin",
          station: { name: "Main Station", address: "Cagayan de Oro City" },
        });
        setLoading(false);
        return { data: { user: demoUser }, error: null };
      }

      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    console.log("signOut called");
    // Set logout flag to prevent session restoration
    hasLoggedOut.current = true;
    isDemoMode.current = false;

    // Clear local state FIRST before awaiting Supabase
    console.log("Clearing user state");
    setUser(null);
    setProfile(null);
    console.log("User state cleared");

    // Try Supabase signOut with a timeout - don't wait forever
    try {
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SignOut timeout")), 3000)
      );
      await Promise.race([signOutPromise, timeoutPromise]);
      console.log("Supabase signOut completed");
    } catch (err) {
      console.log("Supabase signOut skipped or timed out:", err.message);
    }

    return { error: null };
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
