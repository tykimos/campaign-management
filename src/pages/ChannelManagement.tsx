import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Edit2, Trash2, Search, Users, Hash, Calendar, FileText, Link, Mail, Phone, MapPin, ToggleLeft, Save, X } from 'lucide-react';

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
    } else {
      setChannels([]);
      setTypeAttributes([]);
    }
  }, [selectedType]);

  // Auto-select first channel type when loaded
  useEffect(() => {
    if (channelTypes.length > 0 && !selectedType) {
      setSelectedType(channelTypes[0]);
    }
  }, [channelTypes]);

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

  const getAttributeIcon = (code: string) => {
    const icons: { [key: string]: JSX.Element } = {
      'url': <Link size={16} />,
      'member_count': <Users size={16} />,
      'email': <Mail size={16} />,
      'contact_person': <Users size={16} />,
      'contact_phone': <Phone size={16} />,
      'main_phone': <Phone size={16} />,
      'address': <MapPin size={16} />,
      'registration_date': <Calendar size={16} />,
      'update_date': <Calendar size={16} />,
      'is_active': <ToggleLeft size={16} />,
      'memo': <FileText size={16} />
    };
    
    return icons[code] || <Hash size={16} />;
  };


  const renderAttributeInput = (attribute: ChannelAttribute, required: boolean) => {
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
              {attribute.code === 'is_active' ? '활성화' : '활성'}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">채널 관리</h1>
        <p className="text-gray-600 mt-2">채널 유형을 선택하여 채널을 관리합니다.</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Channel Types Tabs - Now at the top */}
        <div className="border-b">
          <div className="flex space-x-1 p-4 overflow-x-auto">
            {channelTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedType?.id === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {selectedType ? (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedType.name}
                    </h2>
                    <p className="text-gray-600 mt-1">{selectedType.description}</p>
                  </div>
                  <button
                    onClick={handleAddChannel}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    채널 추가
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
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

              {/* Channels Grid */}
              {loading ? (
                <div className="text-center py-8">로딩 중...</div>
              ) : filteredChannels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredChannels.map((channel) => (
                    <div key={channel.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{channel.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditChannel(channel)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(channel.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {typeAttributes.map((ta) => {
                          const value = channel[ta.attribute.code];
                          if (value === null || value === undefined || value === '') return null;
                          
                          return (
                            <div key={ta.id} className="flex items-start gap-2">
                              <span className="text-gray-500">
                                {getAttributeIcon(ta.attribute.code)}
                              </span>
                              <div className="flex-1">
                                <span className="text-gray-600">{ta.attribute.name}:</span>
                                <span className="ml-2">
                                  {ta.attribute.data_type === 'boolean'
                                    ? (value ? '활성' : '비활성')
                                    : ta.attribute.code === 'url'
                                    ? (
                                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                          {value}
                                        </a>
                                      )
                                    : value}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {channel.memo && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500">
                              <FileText size={16} />
                            </span>
                            <div className="flex-1">
                              <span className="text-gray-600">메모:</span>
                              <span className="ml-2">{channel.memo}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 채널이 없습니다.'}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              상단에서 채널 유형을 선택해주세요.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Channel Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingChannel ? '채널 수정' : '새 채널 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingChannel(null);
                  setFormData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveChannel();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  채널명 *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {typeAttributes.map((ta) => (
                <div key={ta.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-flex items-center gap-1">
                      {getAttributeIcon(ta.attribute.code)}
                      {ta.attribute.name}
                      {ta.is_required && <span className="text-red-500">*</span>}
                    </span>
                  </label>
                  {renderAttributeInput(ta.attribute, ta.is_required)}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingChannel(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};