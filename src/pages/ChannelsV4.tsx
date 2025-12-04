import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  Search,
  Users,
  Mail,
  Globe
} from 'lucide-react';

interface ChannelType {
  id: number;
  code: string;
  name: string;
  icon?: string;
  color?: string;
}

interface ChannelAttribute {
  code: string;
  name: string;
  data_type: string;
  is_required: boolean;
  value?: any;
}

interface Channel {
  id?: number;
  channel_type_id: number;
  name: string;
  description?: string;
  attributes?: { [key: string]: any };
  is_active?: boolean;
  type_code?: string;
  type_name?: string;
  type_icon?: string;
  type_attributes?: ChannelAttribute[];
}

export const ChannelsV4: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newChannel, setNewChannel] = useState<Channel | null>(null);
  const [editingData, setEditingData] = useState<Channel | null>(null);

  useEffect(() => {
    fetchChannelTypes();
    fetchChannels();
  }, []);

  const fetchChannelTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('channel_types')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setChannelTypes(data || []);
    } catch (error) {
      console.error('Error fetching channel types:', error);
      // Fallback: 미리 정의된 채널 유형 사용
      setChannelTypes([
        { id: 1, code: 'platform_service', name: '플랫폼서비스', color: 'blue' },
        { id: 2, code: 'government', name: '정부기관', color: 'gray' },
        { id: 3, code: 'competition', name: '공모전', color: 'yellow' },
        { id: 4, code: 'portal_cafe', name: '포털카페', color: 'amber' },
        { id: 5, code: 'sns_group', name: 'SNS그룹', color: 'purple' },
        { id: 6, code: 'community', name: '커뮤니티', color: 'green' },
        { id: 7, code: 'open_chat', name: '오픈단톡방', color: 'pink' },
        { id: 8, code: 'discord', name: '디스코드', color: 'indigo' },
        { id: 9, code: 'official_graduate', name: '공문-대학원', color: 'blue' },
        { id: 10, code: 'official_university', name: '공문-대학교', color: 'blue' },
        { id: 11, code: 'official_highschool', name: '공문-고등학교', color: 'blue' },
        { id: 12, code: 'dm_academic', name: 'DM-학회', color: 'red' },
        { id: 13, code: 'dm_association', name: 'DM-협회', color: 'red' },
        { id: 14, code: 'dm_university', name: 'DM-대학', color: 'red' },
        { id: 15, code: 'outdoor_university', name: '옥외광고-대학', color: 'teal' },
        { id: 16, code: 'outdoor_nst', name: '옥외광고-출연연NST', color: 'teal' },
        { id: 17, code: 'outdoor_partner', name: '옥외광고-협력기관', color: 'teal' },
        { id: 18, code: 'performance', name: '퍼포먼스', color: 'cyan' },
        { id: 19, code: 'event_site', name: '이벤트사이트', color: 'amber' }
      ]);
    }
  };

  const fetchChannels = async () => {
    try {
      // Try to fetch from new view first
      let { data, error } = await supabase
        .from('channels_with_type_v2')
        .select('*')
        .order('type_name, name');
      
      if (error) {
        // Fallback to old table
        const { data: oldData, error: oldError } = await supabase
          .from('campaign_channels')
          .select('*')
          .order('name');
        
        if (oldError) throw oldError;
        
        // Transform old data to new format
        data = oldData?.map(ch => ({
          id: ch.id,
          channel_type_id: 1, // Default to platform_service
          name: ch.name,
          description: ch.description,
          attributes: {
            url: ch.url,
            member_count: ch.member_count,
            view_count: ch.avg_daily_views
          },
          is_active: ch.is_active,
          type_name: '플랫폼서비스',
          type_icon: '🌐'
        }));
      }
      
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (channel: Channel) => {
    // Validate required fields
    if (!channel.name || !channel.channel_type_id) {
      alert('채널명과 유형은 필수 항목입니다.');
      return;
    }
    
    try {
      const channelData = {
        channel_type_id: channel.channel_type_id,
        name: channel.name,
        description: channel.description,
        attributes: channel.attributes || {},
        is_active: channel.is_active !== false
      };
      
      if (editingId) {
        const { error } = await supabase
          .from('channels_v2')
          .update(channelData)
          .eq('id', editingId);
        
        if (error) {
          // Fallback to old table
          const oldData = {
            name: channel.name,
            description: channel.description,
            url: channel.attributes?.url,
            member_count: channel.attributes?.member_count,
            avg_daily_views: channel.attributes?.view_count,
            is_active: channel.is_active
          };
          
          const { error: oldError } = await supabase
            .from('campaign_channels')
            .update(oldData)
            .eq('id', editingId);
          
          if (oldError) throw oldError;
        }
      } else {
        const { error } = await supabase
          .from('channels_v2')
          .insert([channelData]);
        
        if (error) {
          // Fallback to old table
          const oldData = {
            name: channel.name,
            category: 'community',
            description: channel.description,
            url: channel.attributes?.url,
            member_count: channel.attributes?.member_count,
            avg_daily_views: channel.attributes?.view_count,
            is_active: channel.is_active
          };
          
          const { error: oldError } = await supabase
            .from('campaign_channels')
            .insert([oldData]);
          
          if (oldError) throw oldError;
        }
      }
      
      fetchChannels();
      setEditingId(null);
      setEditingData(null);
      setNewChannel(null);
    } catch (error) {
      console.error('Error saving channel:', error);
      alert('채널 저장 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 채널을 삭제하시겠습니까?')) return;

    try {
      let { error } = await supabase
        .from('channels_v2')
        .delete()
        .eq('id', id);
      
      if (error) {
        // Fallback to old table
        const { error: oldError } = await supabase
          .from('campaign_channels')
          .delete()
          .eq('id', id);
        
        if (oldError) throw oldError;
      }
      
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  // const renderAttributeInput = (attr: ChannelAttribute, value: any, onChange: (value: any) => void) => {
  //   switch (attr.data_type) {
  //     case 'number':
  //       return (
  //         <input
  //           type="number"
  //           value={value || ''}
  //           onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
  //           placeholder={attr.name}
  //           className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  //         />
  //       );
  //     case 'date':
  //       return (
  //         <input
  //           type="date"
  //           value={value || ''}
  //           onChange={(e) => onChange(e.target.value)}
  //           className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  //         />
  //       );
  //     case 'boolean':
  //       return (
  //         <label className="flex items-center space-x-2">
  //           <input
  //             type="checkbox"
  //             checked={value || false}
  //             onChange={(e) => onChange(e.target.checked)}
  //             className="rounded border-gray-300 text-blue-600"
  //           />
  //           <span>{attr.name}</span>
  //         </label>
  //       );
  //     case 'email':
  //       return (
  //         <input
  //           type="email"
  //           value={value || ''}
  //           onChange={(e) => onChange(e.target.value)}
  //           placeholder={attr.name}
  //           className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  //         />
  //       );
  //     case 'url':
  //       return (
  //         <input
  //           type="url"
  //           value={value || ''}
  //           onChange={(e) => onChange(e.target.value)}
  //           placeholder={attr.name}
  //           className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  //         />
  //       );
  //     default:
  //       return (
  //         <input
  //           type="text"
  //           value={value || ''}
  //           onChange={(e) => onChange(e.target.value)}
  //           placeholder={attr.name}
  //           className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  //         />
  //       );
  //   }
  // };

  // const getAttributeIcon = (code: string) => {
  //   const icons: { [key: string]: LucideIcon } = {
  //     'url': Link,
  //     'member_count': Users,
  //     'view_count': Eye,
  //     'avg_daily_views': Eye,
  //     'posted_date': Calendar,
  //     'registered_date': Calendar,
  //     'deleted_date': Calendar,
  //     'email': Mail,
  //     'phone': Phone,
  //     'homepage_url': Globe,
  //     'contact_person': User,
  //     'contact_phone': Phone,
  //     'pr_contact': User,
  //     'region': MapPin,
  //     'campus_type': Building2,
  //     'academic_system': GraduationCap,
  //     'establishment_type': Building,
  //     'address': MapPin,
  //     'postal_code': MapPin,
  //     'organization_size': Users,
  //     'memo': FileText,
  //     'status': Check,
  //     'verification_status': Shield,
  //     'last_post_date': Calendar,
  //     'response_rate': ChevronRight
  //   };
  //   return icons[code] || FileText;
  // };

  const filteredChannels = channels.filter(channel => {
    const matchesType = selectedType === 'all' || channel.type_code === selectedType;
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          channel.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group channels by type
  const channelsByType = filteredChannels.reduce((acc, channel) => {
    const typeName = channel.type_name || '기타';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(channel);
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
          <p className="text-gray-600 mt-2">총 {channels.length}개 채널</p>
        </div>
        <button
          onClick={() => {
            if (channelTypes.length === 0) {
              alert('먼저 채널 유형을 등록해주세요.');
              return;
            }
            const firstType = channelTypes[0];
            setNewChannel({
              channel_type_id: firstType.id,
              name: '',
              attributes: {},
              is_active: true
            });
          }}
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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">모든 유형</option>
            {channelTypes.map(type => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 새 채널 추가 폼 */}
      {newChannel && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold mb-4">새 채널 추가</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-3 gap-4">
              <select
                value={newChannel.channel_type_id}
                onChange={(e) => setNewChannel(newChannel ? { ...newChannel, channel_type_id: parseInt(e.target.value) } : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {channelTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="채널명 *"
                value={newChannel.name}
                onChange={(e) => setNewChannel(newChannel ? { ...newChannel, name: e.target.value } : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                autoFocus
              />
              <input
                type="text"
                placeholder="설명"
                value={newChannel.description || ''}
                onChange={(e) => setNewChannel(newChannel ? { ...newChannel, description: e.target.value } : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <input
                type="url"
                placeholder="URL"
                value={newChannel.attributes?.url || ''}
                onChange={(e) => setNewChannel(newChannel ? { 
                  ...newChannel, 
                  attributes: { ...newChannel?.attributes, url: e.target.value }
                } : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="회원수"
                value={newChannel.attributes?.member_count || ''}
                onChange={(e) => setNewChannel(newChannel ? { 
                  ...newChannel, 
                  attributes: { ...newChannel?.attributes, member_count: e.target.value ? parseInt(e.target.value) : null }
                } : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="email"
                placeholder="이메일"
                value={newChannel.attributes?.email || ''}
                onChange={(e) => setNewChannel(newChannel ? { 
                  ...newChannel, 
                  attributes: { ...newChannel?.attributes, email: e.target.value }
                } : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => newChannel && handleSave(newChannel)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Save size={18} />
                <span>저장</span>
              </button>
              <button
                onClick={() => setNewChannel(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <X size={18} />
                <span>취소</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채널 목록 (유형별 그룹) */}
      <div className="space-y-4">
        {Object.entries(channelsByType).map(([typeName, typeChannels]) => (
          <div key={typeName} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold flex items-center">
                {typeName}
                <span className="ml-2 text-sm text-gray-500">({typeChannels.length}개)</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">채널명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주요 정보</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeChannels.map((channel) => (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === channel.id ? (
                          <input
                            type="text"
                            value={editingData?.name || ''}
                            onChange={(e) => setEditingData({ ...editingData!, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <div className="font-medium">{channel.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === channel.id ? (
                          <input
                            type="text"
                            value={editingData?.description || ''}
                            onChange={(e) => setEditingData({ ...editingData!, description: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <div className="text-sm text-gray-600">{channel.description || '-'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          {channel.attributes?.url && (
                            <div className="flex items-center space-x-1">
                              <Globe size={14} className="text-gray-400" />
                              <a href={channel.attributes.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                링크
                              </a>
                            </div>
                          )}
                          {channel.attributes?.member_count && (
                            <div className="flex items-center space-x-1">
                              <Users size={14} className="text-gray-400" />
                              <span>{channel.attributes.member_count.toLocaleString()}명</span>
                            </div>
                          )}
                          {channel.attributes?.email && (
                            <div className="flex items-center space-x-1">
                              <Mail size={14} className="text-gray-400" />
                              <span>{channel.attributes.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
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
                                onClick={() => handleSave(editingData!)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingData(null);
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
          </div>
        ))}
        
        {Object.keys(channelsByType).length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {searchTerm || selectedType !== 'all' ? '검색 결과가 없습니다.' : '등록된 채널이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};