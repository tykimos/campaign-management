import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface ChannelAttribute {
  id: number;
  code: string;
  name: string;
  data_type: string;
  is_required?: boolean;
  is_common?: boolean;
  display_order: number;
  default_value?: string;
  validation_rules?: any;
  created_at?: string;
}

const ChannelAttributeManagement: React.FC = () => {
  const [attributes, setAttributes] = useState<ChannelAttribute[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ChannelAttribute | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    data_type: 'text',
    default_value: '',
    display_order: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('channel_attributes')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setAttributes(data || []);
    } catch (error: any) {
      console.error('Error fetching attributes:', error);
      
      // Fallback: 통일된 채널유형속성 목록
      const fallbackAttributes = [
        { id: 1, code: 'name', name: '이름', data_type: 'text', display_order: 1 },
        { id: 2, code: 'registration_date', name: '등록일', data_type: 'date', display_order: 2 },
        { id: 3, code: 'update_date', name: '갱신일', data_type: 'date', display_order: 3 },
        { id: 4, code: 'memo', name: '메모', data_type: 'text', display_order: 4 },
        { id: 5, code: 'member_count', name: '인원', data_type: 'number', display_order: 5 },
        { id: 6, code: 'url', name: 'URL', data_type: 'url', display_order: 6 },
        { id: 7, code: 'email', name: '이메일', data_type: 'email', display_order: 7 },
        { id: 8, code: 'contact_person', name: '담당자', data_type: 'text', display_order: 8 },
        { id: 9, code: 'contact_phone', name: '연락처', data_type: 'text', display_order: 9 },
        { id: 10, code: 'main_phone', name: '대표전화', data_type: 'text', display_order: 10 },
        { id: 11, code: 'address', name: '주소', data_type: 'text', display_order: 11 },
        { id: 12, code: 'is_active', name: '비활성화', data_type: 'boolean', display_order: 12 }
      ];
      
      setAttributes(fallbackAttributes);
      setError('데이터베이스 연결 실패. 기본 데이터를 사용합니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAttribute = async () => {
    try {
      const attributeData = {
        ...formData,
        display_order: attributes.length + 1
      };

      const { data, error } = await supabase
        .from('channel_attributes')
        .insert([attributeData])
        .select()
        .single();
      
      if (error) throw error;
      
      setAttributes([...attributes, data]);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating attribute:', error);
      setError('속성 생성에 실패했습니다.');
    }
  };

  const handleUpdateAttribute = async (id: number, updates: Partial<ChannelAttribute>) => {
    try {
      const { error } = await supabase
        .from('channel_attributes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setAttributes(attributes.map(attr => 
        attr.id === id ? { ...attr, ...updates } : attr
      ));
      setEditingAttribute(null);
    } catch (error: any) {
      console.error('Error updating attribute:', error);
      setError('속성 수정에 실패했습니다.');
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    if (!confirm('이 속성을 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await supabase
        .from('channel_attributes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAttributes(attributes.filter(attr => attr.id !== id));
    } catch (error: any) {
      console.error('Error deleting attribute:', error);
      setError('속성 삭제에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      data_type: 'text',
      default_value: '',
      display_order: 1
    });
  };

  const getDataTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      text: '텍스트',
      number: '숫자',
      date: '날짜',
      boolean: '불린',
      email: '이메일',
      url: 'URL'
    };
    return labels[type] || type;
  };

  const getDataTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      text: 'bg-gray-100 text-gray-800',
      number: 'bg-blue-100 text-blue-800',
      date: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      email: 'bg-yellow-100 text-yellow-800',
      url: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">채널유형속성 관리</h1>
          <p className="text-gray-600 mt-1">채널 유형에서 사용할 속성들을 관리합니다.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>새 속성 추가</span>
        </button>
      </div>

      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 통일된 채널유형속성 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">채널유형속성 목록</h2>
          <p className="text-sm text-gray-500">모든 채널유형에서 사용할 수 있는 통일된 속성 목록</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {attributes.map((attribute) => (
              <div key={attribute.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded border-2 border-blue-200 bg-blue-50 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{attribute.display_order}</span>
                  </div>
                  
                  {editingAttribute?.id === attribute.id ? (
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={editingAttribute.name}
                        onChange={(e) => setEditingAttribute({...editingAttribute, name: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="속성명"
                      />
                      <input
                        type="text"
                        value={editingAttribute.code}
                        onChange={(e) => setEditingAttribute({...editingAttribute, code: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm w-32"
                        placeholder="코드"
                      />
                      <select
                        value={editingAttribute.data_type}
                        onChange={(e) => setEditingAttribute({...editingAttribute, data_type: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="text">텍스트</option>
                        <option value="number">숫자</option>
                        <option value="date">날짜</option>
                        <option value="boolean">불린</option>
                        <option value="email">이메일</option>
                        <option value="url">URL</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-900">{attribute.name}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500 font-mono">{attribute.code}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getDataTypeColor(attribute.data_type)}`}>
                          {getDataTypeLabel(attribute.data_type)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {editingAttribute?.id === attribute.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateAttribute(attribute.id, editingAttribute)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded"
                        title="저장"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingAttribute(null)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="취소"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingAttribute(attribute)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        title="편집"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAttribute(attribute.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 새 속성 추가 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">새 속성 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  속성명
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 담당자명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  속성 코드
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: contact_person"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  데이터 타입
                </label>
                <select
                  value={formData.data_type}
                  onChange={(e) => setFormData({...formData, data_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">텍스트</option>
                  <option value="number">숫자</option>
                  <option value="date">날짜</option>
                  <option value="boolean">불린</option>
                  <option value="email">이메일</option>
                  <option value="url">URL</option>
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본값 (선택사항)
                </label>
                <input
                  type="text"
                  value={formData.default_value}
                  onChange={(e) => setFormData({...formData, default_value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="기본값"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateAttribute}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelAttributeManagement;