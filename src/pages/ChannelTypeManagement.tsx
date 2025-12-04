import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, 
  Edit2, 
  Save,
  X,
  Settings,
  ChevronRight,
  Check,
  Trash2
} from 'lucide-react';

interface ChannelType {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
}

interface ChannelAttribute {
  id: number;
  code: string;
  name: string;
  data_type: string;
  is_required?: boolean;
  display_order: number;
}

interface ChannelTypeAttribute {
  id?: number;
  channel_type_id: number;
  attribute_id: number;
  is_required: boolean;
  display_order: number;
  attribute?: ChannelAttribute;
}

export const ChannelTypeManagement: React.FC = () => {
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [attributes, setAttributes] = useState<ChannelAttribute[]>([]);
  const [typeAttributes, setTypeAttributes] = useState<{ [key: number]: ChannelTypeAttribute[] }>({});
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingAttribute, setEditingAttribute] = useState<ChannelAttribute | null>(null);
  const [newAttribute, setNewAttribute] = useState<Partial<ChannelAttribute> | null>(null);
  const [editingType, setEditingType] = useState<ChannelType | null>(null);
  const [newType, setNewType] = useState<Partial<ChannelType> | null>(null);

  useEffect(() => {
    fetchChannelTypes();
    fetchAttributes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchTypeAttributes(selectedType.id);
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
      
      // Fallback: 미리 정의된 채널 유형 사용
      const fallbackTypes = [
        { id: 1, code: 'platform_service', name: '플랫폼서비스', description: '온라인 플랫폼 및 서비스', color: 'blue', display_order: 1 },
        { id: 2, code: 'government', name: '정부기관', description: '정부 및 공공기관', color: 'gray', display_order: 2 },
        { id: 3, code: 'competition', name: '공모전', description: '공모전 및 대회', color: 'yellow', display_order: 3 },
        { id: 4, code: 'portal_cafe', name: '포털카페', description: '네이버/다음 카페', color: 'amber', display_order: 4 },
        { id: 5, code: 'sns_group', name: 'SNS그룹', description: '페이스북, 인스타그램 등', color: 'purple', display_order: 5 },
        { id: 6, code: 'community', name: '커뮤니티', description: '온라인 커뮤니티', color: 'green', display_order: 6 },
        { id: 7, code: 'open_chat', name: '오픈단톡방', description: '카카오톡 오픈채팅', color: 'pink', display_order: 7 },
        { id: 8, code: 'discord', name: '디스코드', description: '디스코드 서버', color: 'indigo', display_order: 8 },
        { id: 9, code: 'official_graduate', name: '공문-대학원', description: '대학원 공식 채널', color: 'blue', display_order: 9 },
        { id: 10, code: 'official_university', name: '공문-대학교', description: '대학교 공식 채널', color: 'blue', display_order: 10 },
        { id: 11, code: 'official_highschool', name: '공문-고등학교', description: '고등학교 공식 채널', color: 'blue', display_order: 11 },
        { id: 12, code: 'dm_academic', name: 'DM-학회', description: '학회 DM 채널', color: 'red', display_order: 12 },
        { id: 13, code: 'dm_association', name: 'DM-협회', description: '협회 DM 채널', color: 'red', display_order: 13 },
        { id: 14, code: 'dm_university', name: 'DM-대학', description: '대학 DM 채널', color: 'red', display_order: 14 },
        { id: 15, code: 'outdoor_university', name: '옥외광고-대학', description: '대학 옥외광고', color: 'teal', display_order: 15 },
        { id: 16, code: 'outdoor_nst', name: '옥외광고-출연연NST', description: '출연연 옥외광고', color: 'teal', display_order: 16 },
        { id: 17, code: 'outdoor_partner', name: '옥외광고-협력기관', description: '협력기관 옥외광고', color: 'teal', display_order: 17 },
        { id: 18, code: 'performance', name: '퍼포먼스', description: '퍼포먼스 마케팅', color: 'cyan', display_order: 18 },
        { id: 19, code: 'event_site', name: '이벤트사이트', description: '이벤트 사이트', color: 'amber', display_order: 19 }
      ];
      
      setChannelTypes(fallbackTypes);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from('channel_attributes')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setAttributes(data || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      
      // Fallback: 미리 정의된 속성 사용
      const fallbackAttributes = [
        { id: 1, code: 'url', name: 'URL', data_type: 'url', display_order: 1 },
        { id: 2, code: 'member_count', name: '회원수', data_type: 'number', display_order: 2 },
        { id: 3, code: 'view_count', name: '조회수', data_type: 'number', display_order: 3 },
        { id: 4, code: 'posted_date', name: '게재일', data_type: 'date', display_order: 4 },
        { id: 5, code: 'email', name: '이메일', data_type: 'email', display_order: 5 },
        { id: 6, code: 'phone', name: '전화번호', data_type: 'text', display_order: 6 },
        { id: 7, code: 'contact_person', name: '담당자', data_type: 'text', display_order: 7 },
        { id: 8, code: 'address', name: '주소', data_type: 'text', display_order: 8 },
        { id: 9, code: 'memo', name: '메모', data_type: 'text', display_order: 9 }
      ];
      
      setAttributes(fallbackAttributes);
    }
  };

  const fetchTypeAttributes = async (typeId: number) => {
    try {
      const { data, error } = await supabase
        .from('channel_type_attributes')
        .select(`
          *,
          attribute:channel_attributes(*)
        `)
        .eq('channel_type_id', typeId)
        .order('display_order');
      
      if (error) throw error;
      setTypeAttributes(prev => ({ ...prev, [typeId]: data || [] }));
    } catch (error) {
      console.error('Error fetching type attributes:', error);
    }
  };

  const handleSaveAttribute = async () => {
    if (!newAttribute?.code || !newAttribute?.name || !newAttribute?.data_type) {
      alert('속성 코드, 이름, 데이터 타입은 필수입니다.');
      return;
    }

    try {
      if (editingAttribute) {
        const { error } = await supabase
          .from('channel_attributes')
          .update(newAttribute)
          .eq('id', editingAttribute.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('channel_attributes')
          .insert([newAttribute]);
        
        if (error) throw error;
      }
      
      fetchAttributes();
      setNewAttribute(null);
      setEditingAttribute(null);
    } catch (error) {
      console.error('Error saving attribute:', error);
      alert('속성 저장 실패');
    }
  };

  const handleToggleTypeAttribute = async (typeId: number, attributeId: number, isEnabled: boolean) => {
    try {
      if (isEnabled) {
        // 속성 추가
        const maxOrder = typeAttributes[typeId]?.reduce((max, ta) => 
          Math.max(max, ta.display_order), 0) || 0;
        
        const { error } = await supabase
          .from('channel_type_attributes')
          .insert([{
            channel_type_id: typeId,
            attribute_id: attributeId,
            is_required: false,
            display_order: maxOrder + 1
          }]);
        
        if (error) throw error;
      } else {
        // 속성 제거
        const { error } = await supabase
          .from('channel_type_attributes')
          .delete()
          .eq('channel_type_id', typeId)
          .eq('attribute_id', attributeId);
        
        if (error) throw error;
      }
      
      fetchTypeAttributes(typeId);
    } catch (error) {
      console.error('Error toggling type attribute:', error);
    }
  };

  const handleUpdateRequired = async (typeId: number, attributeId: number, isRequired: boolean) => {
    try {
      const { error } = await supabase
        .from('channel_type_attributes')
        .update({ is_required: isRequired })
        .eq('channel_type_id', typeId)
        .eq('attribute_id', attributeId);
      
      if (error) throw error;
      fetchTypeAttributes(typeId);
    } catch (error) {
      console.error('Error updating required status:', error);
    }
  };

  const handleSaveType = async () => {
    if (!newType?.code || !newType?.name) {
      alert('유형 코드와 이름은 필수입니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('channel_types')
        .insert([newType]);
      
      if (error) throw error;
      
      fetchChannelTypes();
      setNewType(null);
    } catch (error) {
      console.error('Error saving channel type:', error);
      alert('채널 유형 저장 실패');
    }
  };

  const handleUpdateType = async (type: ChannelType) => {
    if (!type.code || !type.name) {
      alert('유형 코드와 이름은 필수입니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('channel_types')
        .update({
          code: type.code,
          name: type.name,
          description: type.description,
          color: type.color
        })
        .eq('id', type.id);
      
      if (error) throw error;
      
      fetchChannelTypes();
      setEditingType(null);
      if (selectedType?.id === type.id) {
        setSelectedType(type);
      }
    } catch (error) {
      console.error('Error updating channel type:', error);
      alert('채널 유형 수정 실패');
    }
  };

  const handleDeleteType = async (typeId: number) => {
    // Check if there are channels using this type
    const { data: channels, error: checkError } = await supabase
      .from('channels_v2')
      .select('id')
      .eq('channel_type_id', typeId)
      .limit(1);

    if (checkError) {
      // Try old table
      const { data: oldChannels } = await supabase
        .from('campaign_channels')
        .select('id')
        .limit(1);
      
      if (oldChannels && oldChannels.length > 0) {
        alert('이 유형을 사용 중인 채널이 있어 삭제할 수 없습니다.');
        return;
      }
    } else if (channels && channels.length > 0) {
      alert('이 유형을 사용 중인 채널이 있어 삭제할 수 없습니다.');
      return;
    }

    if (!window.confirm('이 채널 유형을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('channel_types')
        .delete()
        .eq('id', typeId);
      
      if (error) throw error;
      
      fetchChannelTypes();
      if (selectedType?.id === typeId) {
        setSelectedType(null);
      }
    } catch (error) {
      console.error('Error deleting channel type:', error);
      alert('채널 유형 삭제 실패');
    }
  };

  const getDataTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'text': '텍스트',
      'number': '숫자',
      'date': '날짜',
      'boolean': '예/아니오',
      'url': 'URL',
      'email': '이메일'
    };
    return labels[type] || type;
  };

  const getDataTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'text': 'bg-gray-100 text-gray-800',
      'number': 'bg-blue-100 text-blue-800',
      'date': 'bg-green-100 text-green-800',
      'boolean': 'bg-purple-100 text-purple-800',
      'url': 'bg-yellow-100 text-yellow-800',
      'email': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">채널 유형 및 속성 관리</h1>
        <p className="text-gray-600 mt-2">채널 유형별로 필요한 속성을 설정하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 채널 유형 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-lg">채널 유형</h2>
              <button
                onClick={() => setNewType({ code: '', name: '', color: 'gray', display_order: channelTypes.length + 1 })}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                title="새 유형 추가"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {/* 새 유형 추가 폼 */}
            {newType && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="유형 코드 (예: blog)"
                    value={newType.code || ''}
                    onChange={(e) => setNewType({ ...newType, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="유형 이름 (예: 블로그)"
                    value={newType.name || ''}
                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveType}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setNewType(null)}
                      className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="divide-y divide-gray-200">
              {channelTypes.map(type => (
                <div key={type.id} className="relative group">
                  {editingType?.id === type.id ? (
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingType.code || ''}
                          onChange={(e) => setEditingType({ ...editingType, code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={editingType.name || ''}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateType(editingType)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingType(null)}
                            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedType(type)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                        selectedType?.id === type.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-500">{type.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedType?.id === type.id && <ChevronRight size={20} />}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingType(type);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteType(type.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 속성 설정 */}
        <div className="lg:col-span-2">
          {selectedType ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-lg flex items-center">
                  {selectedType.name} 속성 설정
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  이 유형의 채널이 가질 속성을 선택하고 필수 여부를 설정하세요
                </p>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  {attributes.map(attr => {
                    const typeAttr = typeAttributes[selectedType.id]?.find(
                      ta => ta.attribute_id === attr.id
                    );
                    const isEnabled = !!typeAttr;

                    return (
                      <div key={attr.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleToggleTypeAttribute(selectedType.id, attr.id, !isEnabled)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              isEnabled 
                                ? 'bg-blue-600 border-blue-600' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {isEnabled && <Check size={16} className="text-white" />}
                          </button>
                          <div>
                            <div className="font-medium">{attr.name}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500">{attr.code}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getDataTypeColor(attr.data_type)}`}>
                                {getDataTypeLabel(attr.data_type)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isEnabled && (
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={typeAttr?.is_required || false}
                                onChange={(e) => handleUpdateRequired(selectedType.id, attr.id, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">필수</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Settings size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">왼쪽에서 채널 유형을 선택하세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 속성 추가 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">전체 속성 관리</h3>
          <button
            onClick={() => setNewAttribute({ code: '', name: '', data_type: 'text', display_order: 0 })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>새 속성 추가</span>
          </button>
        </div>

        {newAttribute && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="속성 코드 (예: url)"
                value={newAttribute.code || ''}
                onChange={(e) => setNewAttribute({ ...newAttribute, code: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="속성 이름 (예: URL)"
                value={newAttribute.name || ''}
                onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={newAttribute.data_type || 'text'}
                onChange={(e) => setNewAttribute({ ...newAttribute, data_type: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="text">텍스트</option>
                <option value="number">숫자</option>
                <option value="date">날짜</option>
                <option value="boolean">예/아니오</option>
                <option value="url">URL</option>
                <option value="email">이메일</option>
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveAttribute}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={() => {
                    setNewAttribute(null);
                    setEditingAttribute(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          {attributes.map(attr => (
            <div key={attr.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="font-medium">{attr.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({attr.code})</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getDataTypeColor(attr.data_type)}`}>
                  {getDataTypeLabel(attr.data_type)}
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingAttribute(attr);
                  setNewAttribute(attr);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};