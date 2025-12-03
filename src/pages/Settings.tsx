import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, Lock, Bell, Database, Save, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ name: profile.name })
        .eq('id', user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '프로필이 업데이트되었습니다.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '프로필 업데이트에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.new !== password.confirm) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (password.new.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password.new
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '비밀번호 변경에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Fetch all data
      const [campaignsRes, channelsRes, postsRes] = await Promise.all([
        supabase.from('campaigns').select('*'),
        supabase.from('campaign_channels').select('*'),
        supabase.from('campaign_posts').select('*')
      ]);

      const data = {
        exportDate: new Date().toISOString(),
        campaigns: campaignsRes.data,
        channels: channelsRes.data,
        posts: postsRes.data
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: '데이터를 성공적으로 내보냈습니다.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: '데이터 내보내기에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-2">계정 및 시스템 설정을 관리합니다</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-start space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <User size={20} />
            <h2 className="text-lg font-semibold">프로필 설정</h2>
          </div>
        </div>
        <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{loading ? '저장 중...' : '프로필 저장'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <Lock size={20} />
            <h2 className="text-lg font-semibold">비밀번호 변경</h2>
          </div>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              value={password.new}
              onChange={(e) => setPassword({ ...password, new: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={password.confirm}
              onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <Database size={20} />
            <h2 className="text-lg font-semibold">데이터 관리</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-medium mb-2">데이터 내보내기</h3>
            <p className="text-sm text-gray-600 mb-3">
              모든 캠페인, 채널, 게재 데이터를 JSON 형식으로 내보냅니다.
            </p>
            <button
              onClick={handleExportData}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '내보내는 중...' : '데이터 내보내기'}
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">시스템 정보</h2>
        </div>
        <div className="p-6 space-y-2">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">버전</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">사용자 역할</span>
            <span className="font-medium">{user?.role === 'admin' ? '관리자' : '일반 사용자'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">가입일</span>
            <span className="font-medium">
              {user?.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd') : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add format import
import { format } from 'date-fns';