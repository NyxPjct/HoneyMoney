/** Passwords people pick first and attackers try first. */
const COMMON = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "senha123", "senha1234", "qwerty123",
  "abc12345", "11111111", "00000000", "iloveyou", "admin123", "mudar123", "brasil123", "a1b2c3d4",
]);

/**
 * Client-side password rule, the same one configured in Supabase Auth (min 8, letters and digits).
 * Returns the problem in Portuguese, or null when the password is acceptable.
 */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < 8) return "A senha precisa de pelo menos 8 caracteres.";
  if (password.length > 72) return "A senha pode ter no máximo 72 caracteres.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Use letras e números na senha.";
  if (COMMON.has(password.toLowerCase())) return "Essa senha é muito comum. Escolha outra.";
  const user = email?.split("@")[0]?.toLowerCase();
  if (user && user.length >= 4 && password.toLowerCase().includes(user)) return "A senha não pode conter seu e-mail.";
  return null;
}
