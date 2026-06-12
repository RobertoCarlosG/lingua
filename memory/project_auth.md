---
name: project_auth
description: Google OAuth login, RLS setup, multi-user data isolation in Lingua
metadata:
  type: project
---

Auth fue implementado con Supabase Google OAuth (2026-06-11).

**Why:** El usuario quiere que él, su hermano y amigos puedan usar la misma app y trackear progreso individual.

**Cómo está implementado:**
- `frontend/src/lib/auth.tsx` — `AuthProvider` + `useAuth()` hook con `onAuthStateChange`
- `frontend/src/pages/LoginPage.tsx` — pantalla de login con botón "Continuar con Google"
- `frontend/src/App.tsx` — `AuthGuard` protege todas las rutas, `/login` es pública
- `supabase/migrations/002_auth_rls.sql` — cambia `user_id` de `text` a `uuid`, habilita RLS, policies `auth.uid() = user_id` en las 5 tablas

**Pasos manuales pendientes antes de que funcione:**
1. En Supabase Dashboard → Authentication → Providers → habilitar Google, pegar Client ID + Secret de Google Cloud Console
2. En Google Cloud Console → Credentials → OAuth 2.0 → agregar `https://<tu-proyecto>.supabase.co/auth/v1/callback` como Authorized redirect URI
3. Ejecutar `supabase/migrations/002_auth_rls.sql` en el SQL editor de Supabase
4. En Vercel: agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` si no están ya

**How to apply:** Siempre usar `useAuth()` para obtener `user.id` en lugar de `'demo-user'`. RLS garantiza aislamiento automático.
