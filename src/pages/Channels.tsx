import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CampaignChannel } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Users,
  Eye,
  Search,
  Filter
} from 'lucide-react';

export const Channels: React.FC = () => {
  const [channels, setChannels] = useState<CampaignChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<CampaignChannel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'contest' as CampaignChannel['category'],
    url: '',
    member_count: 0,
    avg_daily_views: 0,
    description: '',
    contact_info: '',
    requirements: '',
    is_active: true
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_channels')
        .select('*')
        .order('name');

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingChannel) {
        const { error } = await supabase
          .from('campaign_channels')
          .update(formData)
          .eq('id', editingChannel.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaign_channels')
          .insert([formData]);
        
        if (error) throw error;
      }

      fetchChannels();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving channel:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 채널을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('campaign_channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const handleEdit = (channel: CampaignChannel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      category: channel.category,
      url: channel.url || '',
      member_count: channel.member_count || 0,
      avg_daily_views: channel.avg_daily_views || 0,
      description: channel.description || '',
      contact_info: channel.contact_info || '',
      requirements: channel.requirements || '',
      is_active: channel.is_active
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingChannel(null);
    setFormData({
      name: '',
      category: 'contest',
      url: '',
      member_count: 0,
      avg_daily_views: 0,
      description: '',
      contact_info: '',
      requirements: '',
      is_active: true
    });
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || channel.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      contest: 'bg-yellow-100 text-yellow-800',
      community: 'bg-green-100 text-green-800',
      sns: 'bg-purple-100 text-purple-800',
      event: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const categoryNames: Record<string, string> = {
    contest: '공모전',
    community: '커뮤니티',
    sns: 'SNS',
    event: '이벤트'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">채널 관리</h1>
          <p className="text-gray-600 mt-2">캠페인 게재 채널을 관리합니다</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>채널 추가</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="채널 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 카테고리</option>
              <option value="contest">공모전</option>
              <option value="community">커뮤니티</option>
              <option value="sns">SNS</option>
              <option value="event">이벤트</option>
            </select>
          </div>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChannels.map((channel) => (
          <div key={channel.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(channel.category)}`}>
                  {categoryNames[channel.category]}
                </span>
              </div>

              {channel.description && (
                <p className="text-gray-600 text-sm mb-4">{channel.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {channel.member_count && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Users size={16} className="mr-2" />
                    <span>{channel.member_count.toLocaleString()} 회원</span>
                  </div>
                )}
                {channel.avg_daily_views && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Eye size={16} className="mr-2" />
                    <span>일 평균 {channel.avg_daily_views.toLocaleString()} 조회</span>
                  </div>
                )}
                {channel.url && (
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    <span>사이트 방문</span>
                  </a>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className={`text-sm font-medium ${channel.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {channel.is_active ? '활성' : '비활성'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(channel)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(channel.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-semibold mb-4">
              {editingChannel ? '채널 수정' : '새 채널 추가'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채널명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CampaignChannel['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="contest">공모전</option>
                    <option value="community">커뮤니티</option>
                    <option value="sns">SNS</option>
                    <option value="event">이벤트</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회원 수
                  </label>
                  <input
                    type="number"
                    value={formData.member_count}
                    onChange={(e) => setFormData({ ...formData, member_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    일 평균 조회수
                  </label>
                  <input
                    type="number"
                    value={formData.avg_daily_views}
                    onChange={(e) => setFormData({ ...formData, avg_daily_views: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자 정보
                </label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  게재 요구사항
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  활성 상태
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingChannel ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};