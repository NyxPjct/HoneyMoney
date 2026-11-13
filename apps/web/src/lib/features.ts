/**
 * Feature switches read on the server. Keep them out of "use client" modules: a value imported
 * from a client module into a Server Component is a client reference (always truthy), not the value.
 */

/** Show "Continuar com Google" only after enabling the Google provider in Supabase Auth. */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
