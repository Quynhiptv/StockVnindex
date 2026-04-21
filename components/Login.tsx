
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const sheetId = import.meta.env.VITE_AUTH_SHEET_ID || '13z2aWAtAdjdxQ83vttmicRk9dXd6WqGiQoedGjHFD5c';
    const gid = import.meta.env.VITE_AUTH_SHEET_GID || '376539525';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${new Date().getTime()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể kết nối tới máy chủ xác thực.');

      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
      
      // Row 1 is header, data from row 2
      const users = rows.slice(1);
      const isValidUser = users.find(user => user[0] === username && user[1] === password);

      if (isValidUser) {
        // Save session for 4 hours
        const expiryTime = new Date().getTime() + 4 * 60 * 60 * 1000;
        localStorage.setItem('auth_session', JSON.stringify({
          isLoggedIn: true,
          expiry: expiryTime,
          username: username
        }));
        onLoginSuccess();
      } else {
        setError('Bạn không có quyền đăng nhập xin mời liên hệ quản trị : Đoàn Quỳnh - Zalo 0904301086 . Cảm ơn.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Lỗi kết nối hệ thống. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-100 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Hệ Thống Đăng Nhập</h2>
          <div className="mt-4 space-y-1">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Quản lý vận hành bởi Đoàn Quỳnh</p>
            <p className="text-slate-400 font-medium text-sm">Hotline: 0904301086</p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-5 py-4 border border-slate-200 placeholder-slate-300 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all sm:text-sm font-bold bg-slate-50/50"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-5 py-4 border border-slate-200 placeholder-slate-300 text-slate-900 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all sm:text-sm font-bold bg-slate-50/50"
                placeholder="Nhập mật khẩu"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
              <p className="text-rose-600 text-[13px] font-bold leading-relaxed text-center">
                {error}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-lg shadow-blue-200 uppercase tracking-widest ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang kiểm tra...
                </span>
              ) : (
                'Xác nhận đăng nhập'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center pt-4">
          <p className="text-slate-300 text-xs font-medium italic">
            © 2020 Đoàn Quỳnh Team • Hệ thống phân tích chuyên sâu
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
