export const apiFetch = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('accessToken');
  
  if (!options.headers) {
    options.headers = {};
  }
  
  if (token) {
    (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, options);

  // If token is expired or unauthorized
  if (response.status === 401 || response.status === 403 || response.status === 500) { 
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const text = await refreshRes.text();
          let data;
          try {
             data = JSON.parse(text);
          } catch(e) {}
          
          if (data && data.success && data.data && data.data.accessToken) {
             const newAccessToken = data.data.accessToken;
             const newRefreshToken = data.data.refreshToken;
             
             localStorage.setItem('accessToken', newAccessToken);
             if (newRefreshToken) {
               localStorage.setItem('refreshToken', newRefreshToken);
             }
             
             // Retry original request 
             (options.headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
             response = await fetch(url, options);
          } else {
             localStorage.removeItem('accessToken');
             localStorage.removeItem('refreshToken');
             window.location.href = '/login';
          }
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } catch (err) {
         localStorage.removeItem('accessToken');
         localStorage.removeItem('refreshToken');
         window.location.href = '/login';
      }
    } else {
       localStorage.removeItem('accessToken');
       localStorage.removeItem('refreshToken');
       if (window.location.pathname !== '/login') {
           window.location.href = '/login';
       }
    }
  }

  return response;
};
