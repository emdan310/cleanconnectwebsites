(function () {
  const stateKeys = new Set([
    "cleanconnectRequests",
    "cleanconnectCleaners",
    "cleanconnectUpdates",
    "cleanconnectFinanceEntries",
  ]);
  const config = window.CLEANCONNECT_SUPABASE || {};
  const enabled = Boolean(config.url && config.anonKey && window.supabase?.createClient);
  const client = enabled ? window.supabase.createClient(config.url, config.anonKey) : null;
  let isHydrating = false;

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  const parseJson = (value, fallback) => {
    try {
      return JSON.parse(value || "");
    } catch {
      return fallback;
    }
  };

  const saveState = async (key, value) => {
    if (!enabled || isHydrating || !stateKeys.has(key)) return;

    const parsed = parseJson(value, []);
    const { error } = await client
      .from("app_state")
      .upsert({ key, value: parsed, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) console.warn("CleanConnect Supabase sync failed:", error.message);
  };

  localStorage.setItem = function setSyncedItem(key, value) {
    originalSetItem(key, value);
    void saveState(key, value);
  };

  localStorage.removeItem = function removeSyncedItem(key) {
    originalRemoveItem(key);
  };

  const hydrateState = async () => {
    if (!enabled) return;

    const { data, error } = await client.from("app_state").select("key,value");
    if (error) {
      console.warn("CleanConnect Supabase load failed:", error.message);
      return;
    }

    isHydrating = true;
    data.forEach((row) => {
      if (stateKeys.has(row.key)) {
        originalSetItem(row.key, JSON.stringify(row.value || []));
      }
    });
    isHydrating = false;
  };

  const applyCleanerSession = async () => {
    if (!enabled) return;

    const { data } = await client.auth.getSession();
    const user = data?.session?.user;
    const cleanerName = user?.user_metadata?.cleaner_name;
    if (cleanerName) originalSetItem("cleanconnectCleanerSession", cleanerName);
  };

  window.CleanConnectSync = {
    client,
    enabled,
    getUser: async () => {
      if (!enabled) return null;
      const { data } = await client.auth.getUser();
      return data?.user || null;
    },
    signInOrSignUp: async ({ email, password, metadata = {} }) => {
      if (!enabled) throw new Error("Supabase is not configured yet.");

      const signIn = await client.auth.signInWithPassword({ email, password });
      if (!signIn.error) return signIn.data.user;

      const signUp = await client.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (signUp.error) throw signUp.error;
      return signUp.data.user;
    },
    signOut: async () => {
      if (enabled) await client.auth.signOut();
    },
    ready: (async () => {
      await hydrateState();
      await applyCleanerSession();
    })(),
  };
})();
