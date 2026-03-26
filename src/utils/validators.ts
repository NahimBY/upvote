const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'El correo electrónico es requerido';
  }
  if (!emailRegex.test(email)) {
    return 'El formato del correo electrónico no es válido';
  }
  if (email.length > 254) {
    return 'El correo electrónico es demasiado largo';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password || password === '') {
    return 'La contraseña es requerida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (password.length > 128) {
    return 'La contraseña es demasiado larga';
  }
  return null;
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.replace(/[&<>"'/]/g, (match) => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return escapeMap[match] || match;
  });
};
