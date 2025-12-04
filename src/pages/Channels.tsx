import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CampaignChannel } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Save,
  X,
  Search,
  Filter
} from 'lucide-react';


interface ExtendedChannel extends CampaignChannel {
  channel_type?: string;
  member_count?: number;
  view_count?: number;
  posted_date?: string;
  registered_date?: string;
  deleted_date?: string;
  result?: string;
  memo?: string;
  email?: string;
  phone?: string;
  homepage_url?: string;
  attributes?: any;
}

export const Channels: React.FC = () => {
  const [channels, setChannels] = useState<ExtendedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newChannel, setNewChannel] = useState<Partial<ExtendedChannel> | null>(null);
  const [editingData, setEditingData] = useState<Partial<ExtendedChannel>>({});

  useEffect(() => {
    fetchChannelTypes();
    fetchChannels();
  }, []);

  const fetchChannelTypes = async () => {
    try {
      // Channel types would be fetched here if the table exists
      // For now, using static data
    } catch (error) {
      console.error('Error fetching channel types:', error);
    }
  };

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

  const handleSave = async (channel: Partial<CampaignChannel>) => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('campaign_channels')
          .update(channel)
          .eq('id', editingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaign_channels')
          .insert([channel]);
        
        if (error) throw error;
      }

      fetchChannels();
      setEditingId(null);
      setEditingData({});
      setNewChannel(null);
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

  const startEdit = (channel: CampaignChannel) => {
    setEditingId(channel.id);
    setEditingData(channel);
    setNewChannel(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
    setNewChannel(null);
  };

  const startNewChannel = () => {
    setNewChannel({
      name: '',
      category: 'contest',
      url: '',
      member_count: 0,
      avg_daily_views: 0,
      description: '',
      is_active: true
    });
    setEditingId(null);
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || channel.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
          onClick={startNewChannel}
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

      {/* Channels Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  채널명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회원수
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  일평균 조회수
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  설명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* New Channel Row */}
              {newChannel && (
                <tr className="bg-green-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={newChannel.name || ''}
                      onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="채널명"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={newChannel.category || 'contest'}
                      onChange={(e) => setNewChannel({ ...newChannel, category: e.target.value as CampaignChannel['category'] })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="contest">공모전</option>
                      <option value="community">커뮤니티</option>
                      <option value="sns">SNS</option>
                      <option value="event">이벤트</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="url"
                      value={newChannel.url || ''}
                      onChange={(e) => setNewChannel({ ...newChannel, url: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="https://"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={newChannel.member_count || 0}
                      onChange={(e) => setNewChannel({ ...newChannel, member_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={newChannel.avg_daily_views || 0}
                      onChange={(e) => setNewChannel({ ...newChannel, avg_daily_views: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={newChannel.description || ''}
                      onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="설명"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={newChannel.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setNewChannel({ ...newChannel, is_active: e.target.value === 'active' })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => handleSave(newChannel)}
                        className="p-1 text-green-600 hover:text-green-900"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-600 hover:text-red-900"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Existing Channels */}
              {filteredChannels.map((channel) => (
                <tr key={channel.id} className={editingId === channel.id ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3 text-sm">
                    {editingId === channel.id ? (
                      <input
                        type="text"
                        value={editingData.name || ''}
                        onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{channel.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === channel.id ? (
                      <select
                        value={editingData.category || 'contest'}
                        onChange={(e) => setEditingData({ ...editingData, category: e.target.value as CampaignChannel['category'] })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="contest">공모전</option>
                        <option value="community">커뮤니티</option>
                        <option value="sns">SNS</option>
                        <option value="event">이벤트</option>
                      </select>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">
                        {categoryNames[channel.category]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === channel.id ? (
                      <input
                        type="url"
                        value={editingData.url || ''}
                        onChange={(e) => setEditingData({ ...editingData, url: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      channel.url && (
                        <a
                          href={channel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          <span className="truncate max-w-xs">{channel.url}</span>
                        </a>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {editingId === channel.id ? (
                      <input
                        type="number"
                        value={editingData.member_count || 0}
                        onChange={(e) => setEditingData({ ...editingData, member_count: parseInt(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      channel.member_count?.toLocaleString() || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {editingId === channel.id ? (
                      <input
                        type="number"
                        value={editingData.avg_daily_views || 0}
                        onChange={(e) => setEditingData({ ...editingData, avg_daily_views: parseInt(e.target.value) || 0 })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      channel.avg_daily_views?.toLocaleString() || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {editingId === channel.id ? (
                      <input
                        type="text"
                        value={editingData.description || ''}
                        onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <span className="truncate max-w-xs block">{channel.description}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === channel.id ? (
                      <select
                        value={editingData.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setEditingData({ ...editingData, is_active: e.target.value === 'active' })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        channel.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {channel.is_active ? '활성' : '비활성'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex justify-center space-x-1">
                      {editingId === channel.id ? (
                        <>
                          <button
                            onClick={() => handleSave(editingData)}
                            className="p-1 text-green-600 hover:text-green-900"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(channel)}
                            className="p-1 text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(channel.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 px-6 py-3 border-t">
          <div className="text-sm text-gray-600">
            총 {filteredChannels.length}개 채널 
            {categoryFilter !== 'all' && ` (${categoryNames[categoryFilter]} 카테고리)`}
          </div>
        </div>
      </div>
    </div>
  );
};