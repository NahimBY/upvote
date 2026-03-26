const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateName = (name: string): string | null => {
  if (!name || name.trim() === '') {
    return 'El nombre es requerido';
  }
  if (name.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  if (name.length > 100) {
    return 'El nombre es demasiado largo';
  }
  return null;
};

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

export const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
  if (!confirmPassword || confirmPassword === '') {
    return 'La confirmación de la contraseña es requerida';
  }
  if (confirmPassword !== password) {
    return 'Las contraseñas no coinciden';
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
