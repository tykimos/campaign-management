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
  ArrowLeft,
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
  Eye,
  Hash,
  Building2,
  Megaphone
} from 'lucide-react';

interface Channel {
  id?: number;
  name: string;
  category?: string;
  url?: string;
  description?: string;
  member_count?: number;
  avg_daily_views?: number;
  is_active?: boolean;
}

interface ChannelTypeInfo {
  id: string;
  name: string;
  icon: JSX.Element;
  color: string;
  count?: number;
  description: string;
}

export const ChannelsV3: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newChannel, setNewChannel] = useState<Channel | null>(null);
  const [editingData, setEditingData] = useState<Partial<Channel>>({});
  const [channelCounts, setChannelCounts] = useState<{ [key: string]: number }>({});

  const channelTypes: ChannelTypeInfo[] = [
    { id: 'platform_service', name: '플랫폼서비스', icon: <Globe size={24} />, color: 'bg-blue-500', description: '온라인 플랫폼 및 서비스' },
    { id: 'government', name: '정부기관', icon: <Building size={24} />, color: 'bg-gray-600', description: '정부 및 공공기관' },
    { id: 'competition', name: '공모전', icon: <Trophy size={24} />, color: 'bg-yellow-500', description: '공모전 및 대회' },
    { id: 'portal_cafe', name: '포털카페', icon: <Coffee size={24} />, color: 'bg-amber-600', description: '네이버/다음 카페' },
    { id: 'sns_group', name: 'SNS그룹', icon: <Smartphone size={24} />, color: 'bg-purple-500', description: '페이스북, 인스타그램 등' },
    { id: 'community', name: '커뮤니티', icon: <UsersIcon size={24} />, color: 'bg-green-500', description: '온라인 커뮤니티' },
    { id: 'blog', name: '블로그', icon: <FileText size={24} />, color: 'bg-orange-500', description: '블로그 채널' },
    { id: 'open_chat', name: '오픈단톡방', icon: <MessageCircle size={24} />, color: 'bg-pink-500', description: '카카오톡 오픈채팅' },
    { id: 'discord', name: '디스코드', icon: <MessageCircle size={24} />, color: 'bg-indigo-500', description: '디스코드 서버' },
    { id: 'university', name: '대학교공문', icon: <GraduationCap size={24} />, color: 'bg-blue-600', description: '대학교 공식 채널' },
    { id: 'graduate', name: '대학원공문', icon: <GraduationCap size={24} />, color: 'bg-blue-700', description: '대학원 공식 채널' },
    { id: 'highschool', name: '고등학교공문', icon: <Building2 size={24} />, color: 'bg-blue-400', description: '고등학교 공식 채널' },
    { id: 'institution', name: '기관공문', icon: <Building size={24} />, color: 'bg-gray-700', description: '기관 공식 채널' },
    { id: 'dm_academic', name: 'DM-학회', icon: <Mail size={24} />, color: 'bg-red-500', description: '학회 DM 채널' },
    { id: 'dm_association', name: 'DM-협회', icon: <Mail size={24} />, color: 'bg-red-600', description: '협회 DM 채널' },
    { id: 'dm_university', name: 'DM-대학', icon: <Mail size={24} />, color: 'bg-red-700', description: '대학 DM 채널' },
    { id: 'outdoor_university', name: '옥외광고-대학', icon: <Target size={24} />, color: 'bg-teal-500', description: '대학 옥외광고' },
    { id: 'outdoor_nst', name: '옥외광고-출연연NST', icon: <Target size={24} />, color: 'bg-teal-600', description: '출연연 옥외광고' },
    { id: 'outdoor_partner', name: '옥외광고-협력기관', icon: <Target size={24} />, color: 'bg-teal-700', description: '협력기관 옥외광고' },
    { id: 'performance', name: '퍼포먼스', icon: <BarChart size={24} />, color: 'bg-cyan-500', description: '퍼포먼스 마케팅' },
    { id: 'event_site', name: '이벤트사이트', icon: <Calendar size={24} />, color: 'bg-amber-500', description: '이벤트 사이트' }
  ];

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
      
      if (data) {
        setChannels(data);
        
        // 채널 유형별 개수 계산
        const counts: { [key: string]: number } = {};
        data.forEach(channel => {
          // description에서 채널 유형 추출
          const typeMatch = channel.description?.match(/^(플랫폼서비스|정부기관|공모전|포털카페|SNS그룹|커뮤니티|블로그|오픈단톡방|디스코드|대학교공문|대학원공문|고등학교공문|기관공문|DM-학회|DM-협회|DM-대학|옥외광고-대학|옥외광고-출연연NST|옥외광고-협력기관|퍼포먼스|이벤트사이트)/);
          if (typeMatch) {
            const type = typeMatch[1];
            const typeId = channelTypes.find(t => t.name === type)?.id;
            if (typeId) {
              counts[typeId] = (counts[typeId] || 0) + 1;
            }
          }
        });
        setChannelCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelType = (channel: Channel): string | null => {
    const typeMatch = channel.description?.match(/^(플랫폼서비스|정부기관|공모전|포털카페|SNS그룹|커뮤니티|블로그|오픈단톡방|디스코드|대학교공문|대학원공문|고등학교공문|기관공문|DM-학회|DM-협회|DM-대학|옥외광고-대학|옥외광고-출연연NST|옥외광고-협력기관|퍼포먼스|이벤트사이트)/);
    if (typeMatch) {
      const type = typeMatch[1];
      const typeId = channelTypes.find(t => t.name === type)?.id;
      return typeId || null;
    }
    return null;
  };

  const filteredChannels = channels.filter(channel => {
    if (!selectedType) return false;
    const channelType = getChannelType(channel);
    if (channelType !== selectedType) return false;
    
    if (searchTerm) {
      return channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             channel.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             channel.description?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const handleSave = async (channel: Channel) => {
    try {
      // 선택된 유형을 description 앞에 추가
      if (selectedType && !channel.description?.startsWith(channelTypes.find(t => t.id === selectedType)?.name || '')) {
        const typeName = channelTypes.find(t => t.id === selectedType)?.name;
        const existingDesc = channel.description?.replace(/^(플랫폼서비스|정부기관|공모전|포털카페|SNS그룹|커뮤니티|블로그|오픈단톡방|디스코드|대학교공문|대학원공문|고등학교공문|기관공문|DM-학회|DM-협회|DM-대학|옥외광고-대학|옥외광고-출연연NST|옥외광고-협력기관|퍼포먼스|이벤트사이트)\s*-\s*/, '').trim();
        channel.description = existingDesc ? `${typeName} - ${existingDesc}` : typeName;
      }
      
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

  const getTypeSpecificFields = (type: string) => {
    // 유형별 특수 속성 정의
    const typeFields: { [key: string]: string[] } = {
      'platform_service': ['url', 'member_count', 'avg_daily_views'],
      'government': ['url', 'avg_daily_views'],
      'competition': ['url', 'avg_daily_views'],
      'portal_cafe': ['url', 'member_count', 'avg_daily_views'],
      'sns_group': ['url', 'member_count', 'avg_daily_views'],
      'community': ['url', 'member_count', 'avg_daily_views'],
      'blog': ['url', 'avg_daily_views'],
      'open_chat': ['member_count'],
      'discord': ['url', 'member_count'],
      'university': ['url'],
      'graduate': ['url'],
      'highschool': ['url'],
      'institution': ['url'],
      'dm_academic': ['url'],
      'dm_association': ['url'],
      'dm_university': [],
      'outdoor_university': [],
      'outdoor_nst': [],
      'outdoor_partner': [],
      'performance': ['url', 'avg_daily_views'],
      'event_site': ['url', 'avg_daily_views']
    };
    
    return typeFields[type] || ['url', 'member_count', 'avg_daily_views'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!selectedType) {
    // 카드 선택 화면
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">채널 관리</h1>
          <p className="text-gray-600 mt-2">채널 유형을 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {channelTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`${type.color} text-white rounded-lg p-4 mb-4 flex justify-center`}>
                {type.icon}
              </div>
              <h3 className="font-semibold text-lg mb-1">{type.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{type.description}</p>
              <p className="text-2xl font-bold text-gray-900">{channelCounts[type.id] || 0}</p>
              <p className="text-sm text-gray-500">채널</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentType = channelTypes.find(t => t.id === selectedType);
  const typeFields = getTypeSpecificFields(selectedType);

  // 선택된 유형의 채널 목록
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedType(null)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className={`${currentType?.color} text-white p-2 rounded-lg mr-3`}>
                {currentType?.icon}
              </span>
              {currentType?.name}
            </h1>
            <p className="text-gray-600 mt-1">{filteredChannels.length}개 채널</p>
          </div>
        </div>
        <button
          onClick={() => setNewChannel({ 
            name: '', 
            is_active: true,
            description: currentType?.name
          })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>채널 추가</span>
        </button>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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

      {/* 새 채널 추가 폼 */}
      {newChannel && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold mb-4">새 채널 추가</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <input
                type="text"
                placeholder="채널명"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                autoFocus
              />
            </div>
            {typeFields.includes('url') && (
              <div className="col-span-4">
                <input
                  type="text"
                  placeholder="URL"
                  value={newChannel.url || ''}
                  onChange={(e) => setNewChannel({ ...newChannel, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            {typeFields.includes('member_count') && (
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="회원수"
                  value={newChannel.member_count || ''}
                  onChange={(e) => setNewChannel({ ...newChannel, member_count: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            {typeFields.includes('avg_daily_views') && (
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="일평균 조회수"
                  value={newChannel.avg_daily_views || ''}
                  onChange={(e) => setNewChannel({ ...newChannel, avg_daily_views: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
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

      {/* 채널 목록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널명</th>
              {typeFields.includes('url') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              )}
              {typeFields.includes('member_count') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">회원수</th>
              )}
              {typeFields.includes('avg_daily_views') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일평균 조회수</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChannels.map((channel) => (
              <tr key={channel.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
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
                {typeFields.includes('url') && (
                  <td className="px-6 py-4 whitespace-nowrap">
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
                )}
                {typeFields.includes('member_count') && (
                  <td className="px-6 py-4 whitespace-nowrap">
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
                )}
                {typeFields.includes('avg_daily_views') && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === channel.id ? (
                      <input
                        type="number"
                        value={editingData.avg_daily_views || ''}
                        onChange={(e) => setEditingData({ ...editingData, avg_daily_views: parseInt(e.target.value) || undefined })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      channel.avg_daily_views ? (
                        <div className="flex items-center">
                          <Eye size={14} className="mr-1 text-gray-400" />
                          {channel.avg_daily_views.toLocaleString()}
                        </div>
                      ) : '-'
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    channel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {channel.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {editingId === channel.id ? (
                      <>
                        <button
                          onClick={() => handleSave({ ...channel, ...editingData })}
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
        
        {filteredChannels.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 채널이 없습니다.'}
          </div>
        )}
      </div>
    </div>
  );
};