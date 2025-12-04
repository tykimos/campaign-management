import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Save,
  X,
  Search,
  ChevronDown,
  Globe,
  Building,
  Trophy,
  Coffee,
  Smartphone,
  Users as UsersIcon,
  FileText,
  MessageCircle,
  GraduationCap,
  Mail,
  Target,
  BarChart,
  Calendar,
  Eye
} from 'lucide-react';

interface ChannelType {
  id: string;
  name: string;
  icon: string;
  display_order: number;
  attributes_config: any;
}

interface Channel {
  id?: number;
  channel_type: string;
  name: string;
  url?: string;
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
  is_active?: boolean;
}

export const ChannelsV2: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newChannel, setNewChannel] = useState<Channel | null>(null);
  const [editingData, setEditingData] = useState<Partial<Channel>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchChannelTypes();
    fetchChannels();
  }, []);

  const fetchChannelTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_channel_types')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setChannelTypes(data || []);
    } catch (error) {
      console.error('Error fetching channel types:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_channels')
        .select('*')
        .order('channel_type, name');

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelTypeIcon = (typeId: string) => {
    const icons: { [key: string]: JSX.Element } = {
      'platform_service': <Globe size={16} className="text-blue-500" />,
      'government': <Building size={16} className="text-gray-600" />,
      'competition': <Trophy size={16} className="text-yellow-500" />,
      'portal_cafe': <Coffee size={16} className="text-brown-500" />,
      'sns_group': <Smartphone size={16} className="text-purple-500" />,
      'community': <UsersIcon size={16} className="text-green-500" />,
      'blog': <FileText size={16} className="text-orange-500" />,
      'open_chat': <MessageCircle size={16} className="text-pink-500" />,
      'discord': <MessageCircle size={16} className="text-indigo-500" />,
      'university': <GraduationCap size={16} className="text-blue-600" />,
      'graduate': <GraduationCap size={16} className="text-blue-700" />,
      'highschool': <GraduationCap size={16} className="text-blue-500" />,
      'institution': <Building size={16} className="text-gray-700" />,
      'dm_academic': <Mail size={16} className="text-red-500" />,
      'dm_association': <Mail size={16} className="text-red-600" />,
      'dm_university': <Mail size={16} className="text-red-700" />,
      'outdoor_university': <Target size={16} className="text-teal-500" />,
      'outdoor_nst': <Target size={16} className="text-teal-600" />,
      'outdoor_partner': <Target size={16} className="text-teal-700" />,
      'performance': <BarChart size={16} className="text-cyan-500" />,
      'event_site': <Calendar size={16} className="text-amber-500" />
    };
    return icons[typeId] || <Globe size={16} />;
  };

  const handleSave = async (channel: Channel) => {
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

  const toggleTypeExpansion = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.memo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || channel.channel_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // 채널을 유형별로 그룹화
  const channelsByType = filteredChannels.reduce((acc, channel) => {
    if (!acc[channel.channel_type]) {
      acc[channel.channel_type] = [];
    }
    acc[channel.channel_type].push(channel);
    return acc;
  }, {} as { [key: string]: Channel[] });

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
          <p className="text-gray-600 mt-2">총 {channels.length}개 채널 ({channelTypes.length}개 유형)</p>
        </div>
        <button
          onClick={() => setNewChannel({ 
            channel_type: 'platform_service', 
            name: '', 
            is_active: true 
          })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>채널 추가</span>
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="채널 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">모든 유형</option>
            {channelTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.icon} {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 새 채널 추가 폼 */}
      {newChannel && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold mb-4">새 채널 추가</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2">
              <select
                value={newChannel.channel_type}
                onChange={(e) => setNewChannel({ ...newChannel, channel_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {channelTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <input
                type="text"
                placeholder="채널명"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-3">
              <input
                type="text"
                placeholder="URL"
                value={newChannel.url || ''}
                onChange={(e) => setNewChannel({ ...newChannel, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                placeholder="회원수"
                value={newChannel.member_count || ''}
                onChange={(e) => setNewChannel({ ...newChannel, member_count: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="col-span-2 flex space-x-2">
              <button
                onClick={() => handleSave(newChannel)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Save size={18} />
              </button>
              <button
                onClick={() => setNewChannel(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채널 목록 (유형별 그룹) */}
      <div className="space-y-4">
        {channelTypes.map(type => {
          const typeChannels = channelsByType[type.id] || [];
          if (typeFilter !== 'all' && typeFilter !== type.id && typeChannels.length === 0) return null;

          const isExpanded = expandedTypes.has(type.id);

          return (
            <div key={type.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleTypeExpansion(type.id)}
              >
                <div className="flex items-center space-x-3">
                  {getChannelTypeIcon(type.id)}
                  <span className="font-semibold">{type.name}</span>
                  <span className="text-sm text-gray-500">({typeChannels.length}개)</span>
                </div>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>

              {isExpanded && typeChannels.length > 0 && (
                <div className="border-t border-gray-200">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이름</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">URL</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">회원수</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">조회수</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">게재일</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">메모</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {typeChannels.map((channel) => (
                        <tr key={channel.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {editingId === channel.id ? (
                              <input
                                type="text"
                                value={editingData.name || ''}
                                onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            ) : (
                              <span className="font-medium">{channel.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {editingId === channel.id ? (
                              <input
                                type="text"
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
                                  className="text-blue-600 hover:underline flex items-center"
                                >
                                  <ExternalLink size={14} className="mr-1" />
                                  링크
                                </a>
                              )
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {editingId === channel.id ? (
                              <input
                                type="number"
                                value={editingData.member_count || ''}
                                onChange={(e) => setEditingData({ ...editingData, member_count: parseInt(e.target.value) || undefined })}
                                className="w-20 px-2 py-1 border border-gray-300 rounded"
                              />
                            ) : (
                              channel.member_count ? (
                                <div className="flex items-center">
                                  <UsersIcon size={14} className="mr-1 text-gray-400" />
                                  {channel.member_count.toLocaleString()}
                                </div>
                              ) : '-'
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {channel.view_count ? (
                              <div className="flex items-center">
                                <Eye size={14} className="mr-1 text-gray-400" />
                                {channel.view_count.toLocaleString()}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2">
                            {channel.posted_date || '-'}
                          </td>
                          <td className="px-4 py-2">
                            {editingId === channel.id ? (
                              <input
                                type="text"
                                value={editingData.memo || ''}
                                onChange={(e) => setEditingData({ ...editingData, memo: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            ) : (
                              <span className="text-sm text-gray-600">{channel.memo || '-'}</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex space-x-2">
                              {editingId === channel.id ? (
                                <>
                                  <button
                                    onClick={() => handleSave(editingData as Channel)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Save size={18} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingData({});
                                    }}
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <X size={18} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingId(channel.id!);
                                      setEditingData(channel);
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(channel.id!)}
                                    className="text-red-600 hover:text-red-700"
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};