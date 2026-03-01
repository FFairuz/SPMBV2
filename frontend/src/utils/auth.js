export const getToken = () => localStorage.getItem('spmb_token');

export const getUser = () => {
  const user = localStorage.getItem('spmb_user');
  return user ? JSON.parse(user) : null;
};

export const setAuth = (token, user) => {
  localStorage.setItem('spmb_token', token);
  localStorage.setItem('spmb_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('spmb_token');
  localStorage.removeItem('spmb_user');
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};

export const isPanitia = () => {
  const user = getUser();
  return user?.role === 'panitia';
};

export const isBendahara = () => {
  const user = getUser();
  return user?.role === 'bendahara';
};

// Admin, Panitia, atau Bendahara
export const isStaff = () => {
  const user = getUser();
  return ['admin', 'panitia', 'bendahara'].includes(user?.role);
};

export const hasRole = (...roles) => {
  const user = getUser();
  return roles.includes(user?.role);
};

export const getRoleLabel = (role) => {
  const map = {
    admin: '👑 Administrator',
    panitia: '📋 Panitia',
    bendahara: '💰 Bendahara',
    siswa: '🎓 Calon Siswa',
  };
  return map[role] || role;
};
