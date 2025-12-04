import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Search, Filter, ChevronRight, Save, X } from 'lucide-react';

interface ChannelType {
  id: number;
  code: string;
  name: string;
  description: string;
  color: string;
  display_order: number;
}

interface ChannelAttribute {
  id: number;
  code: string;
  name: string;
  data_type: string;
  is_required: boolean;
  display_order: number;
}

interface Channel {
  id: number;
  channel_type_id: number;
  name: string;
  url?: string;
  member_count?: number;
  email?: string;
  contact_person?: string;
  contact_phone?: string;
  main_phone?: string;
  address?: string;
  memo?: string;
  registration_date?: string;
  update_date?: string;
  is_active: boolean;
  [key: string]: any;
}

interface TypeAttribute {
  id: number;
  channel_type_id: number;
  attribute_id: number;
  is_required: boolean;
  attribute: ChannelAttribute;
}

export const ChannelManagement: React.FC = () => {
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [typeAttributes, setTypeAttributes] = useState<TypeAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Load channel types
  useEffect(() => {
    fetchChannelTypes();
  }, []);

  // Load channels and attributes when type is selected
  useEffect(() => {
    if (selectedType) {
      fetchChannels();
      fetchTypeAttributes();
    }
  }, [selectedType]);

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
    }
  };

  const fetchChannels = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels_v2')
        .select('*')
        .eq('channel_type_id', selectedType.id)
        .order('name');
      
      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeAttributes = async () => {
    if (!selectedType) return;
    
    try {
      const { data, error } = await supabase
        .from('channel_type_attributes')
        .select(`
          *,
          attribute:channel_attributes(*)
        `)
        .eq('channel_type_id', selectedType.id)
        .order('display_order');
      
      if (error) throw error;
      setTypeAttributes(data || []);
    } catch (error) {
      console.error('Error fetching type attributes:', error);
    }
  };

  const handleAddChannel = () => {
    setShowAddForm(true);
    setEditingChannel(null);
    const initialData: Record<string, any> = {
      name: '',
      channel_type_id: selectedType?.id
    };
    
    typeAttributes.forEach(ta => {
      if (ta.attribute.code === 'registration_date') {
        initialData[ta.attribute.code] = new Date().toISOString().split('T')[0];
      } else if (ta.attribute.code === 'is_active') {
        initialData[ta.attribute.code] = true;
      } else if (ta.attribute.data_type === 'boolean') {
        initialData[ta.attribute.code] = false;
      } else {
        initialData[ta.attribute.code] = '';
      }
    });
    
    setFormData(initialData);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setShowAddForm(true);
    setFormData({ ...channel });
  };

  const handleSaveChannel = async () => {
    if (!selectedType) return;
    
    try {
      const channelData = {
        ...formData,
        channel_type_id: selectedType.id,
        update_date: new Date().toISOString().split('T')[0]
      };
      
      if (editingChannel) {
        const { error } = await supabase
          .from('channels_v2')
          .update(channelData)
          .eq('id', editingChannel.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('channels_v2')
          .insert([channelData]);
        
        if (error) throw error;
      }
      
      setShowAddForm(false);
      setEditingChannel(null);
      setFormData({});
      fetchChannels();
    } catch (error) {
      console.error('Error saving channel:', error);
      alert('채널 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteChannel = async (channelId: number) => {
    if (!confirm('정말로 이 채널을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('channels_v2')
        .delete()
        .eq('id', channelId);
      
      if (error) throw error;
      fetchChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('채널 삭제 중 오류가 발생했습니다.');
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderFormField = (attribute: ChannelAttribute, required: boolean) => {
    const value = formData[attribute.code] || '';
    
    switch (attribute.data_type) {
      case 'text':
        if (attribute.code === 'memo') {
          return (
            <textarea
              value={value}
              onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required={required}
            />
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={required}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={required}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={required}
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              {attribute.code === 'is_active' ? '비활성화' : '활성'}
            </label>
          </div>
        );
      
      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://"
            required={required}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@domain.com"
            required={required}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [attribute.code]: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={required}
          />
        );
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.memo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Left: Channel Types List */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">채널 유형</h2>
        <div className="space-y-2">
          {channelTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                selectedType?.id === type.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div>
                <div className="font-medium">{type.name}</div>
                <div className="text-sm text-gray-500">{type.description}</div>
              </div>
              <ChevronRight size={20} className={`transition-transform ${
                selectedType?.id === type.id ? 'rotate-90' : ''
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Right: Channels List */}
      <div className="flex-1 bg-gray-50 p-6">
        {selectedType ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {selectedType.name} 채널 관리
                  </h1>
                  <p className="text-gray-600 mt-1">{selectedType.description}</p>
                </div>
                <button
                  onClick={handleAddChannel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  채널 추가
                </button>
              </div>

              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="채널 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Channels Table */}
            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {typeAttributes.map((ta) => (
                        <th key={ta.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {ta.attribute.name}
                          {ta.is_required && <span className="text-red-500 ml-1">*</span>}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredChannels.map((channel) => (
                      <tr key={channel.id} className="hover:bg-gray-50">
                        {typeAttributes.map((ta) => (
                          <td key={ta.id} className="px-6 py-4 whitespace-nowrap">
                            {ta.attribute.data_type === 'boolean' ? (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                channel[ta.attribute.code] 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {channel[ta.attribute.code] ? '비활성' : '활성'}
                              </span>
                            ) : ta.attribute.data_type === 'url' && channel[ta.attribute.code] ? (
                              <a 
                                href={channel[ta.attribute.code]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                링크
                              </a>
                            ) : (
                              <span className="text-gray-900">
                                {channel[ta.attribute.code] || '-'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleEditChannel(channel)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(channel.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredChannels.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    등록된 채널이 없습니다.
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            좌측에서 채널 유형을 선택해주세요.
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingChannel ? '채널 수정' : '새 채널 추가'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingChannel(null);
                    setFormData({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {typeAttributes.map((ta) => (
                  <div key={ta.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {ta.attribute.name}
                      {ta.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFormField(ta.attribute, ta.is_required)}
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingChannel(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveChannel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={20} />
                  {editingChannel ? '수정' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};