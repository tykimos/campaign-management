import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Campaign, CampaignChannel, CampaignPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Save,
  X,
  ExternalLink,
  Calendar,
  ChevronRight,
  Edit2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface ChannelPostStatus {
  channel: CampaignChannel;
  post?: CampaignPost;
  isEditing?: boolean;
  editData?: Partial<CampaignPost>;
}

export const Posts: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channels, setChannels] = useState<CampaignChannel[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [channelPostStatuses, setChannelPostStatuses] = useState<ChannelPostStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadCampaignPosts();
    }
  }, [selectedCampaign]);

  const fetchInitialData = async () => {
    try {
      const [campaignsRes, channelsRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('campaign_channels')
          .select('*')
          .eq('is_active', true)
          .order('category, name')
      ]);

      setCampaigns(campaignsRes.data || []);
      setChannels(channelsRes.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignPosts = async () => {
    if (!selectedCampaign) return;

    try {
      const { data: postsData, error } = await supabase
        .from('campaign_posts')
        .select('*')
        .eq('campaign_id', selectedCampaign.id);

      if (error) throw error;
      
      // Create channel-post status mapping
      const statuses: ChannelPostStatus[] = channels.map(channel => {
        const post = postsData?.find(p => p.channel_id === channel.id);
        return {
          channel,
          post,
          isEditing: false
        };
      });
      
      setChannelPostStatuses(statuses);
    } catch (error) {
      console.error('Error loading campaign posts:', error);
    }
  };

  const handleEditPost = (channelId: number, post?: CampaignPost) => {
    setChannelPostStatuses(prev => prev.map(status => {
      if (status.channel.id === channelId) {
        return {
          ...status,
          isEditing: true,
          editData: post ? {
            ...post
          } : {
            campaign_id: selectedCampaign!.id,
            channel_id: channelId,
            post_url: '',
            title: '',
            posted_date: format(new Date(), 'yyyy-MM-dd'),
            view_count: 0,
            click_count: 0,
            registration_count: 0,
            status: 'pending' as CampaignPost['status'],
            notes: ''
          }
        };
      }
      return status;
    }));
  };

  const handleCancelEdit = (channelId: number) => {
    setChannelPostStatuses(prev => prev.map(status => {
      if (status.channel.id === channelId) {
        return {
          ...status,
          isEditing: false,
          editData: undefined
        };
      }
      return status;
    }));
  };

  const handleSavePost = async (channelId: number) => {
    const status = channelPostStatuses.find(s => s.channel.id === channelId);
    if (!status?.editData || !selectedCampaign) return;

    setSavingIds(prev => new Set([...prev, channelId]));

    try {
      const postData = {
        ...status.editData,
        campaign_id: selectedCampaign.id,
        channel_id: channelId,
        posted_by: user?.id,
        deleted_date: status.editData.deleted_date || null,
        result: status.editData.result || null
      };

      if (status.post) {
        // Update existing post
        const { error } = await supabase
          .from('campaign_posts')
          .update(postData)
          .eq('id', status.post.id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase
          .from('campaign_posts')
          .insert([postData]);

        if (error) throw error;
      }

      await loadCampaignPosts();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });
    }
  };

  const handleUpdateEditData = (channelId: number, field: string, value: any) => {
    setChannelPostStatuses(prev => prev.map(status => {
      if (status.channel.id === channelId) {
        return {
          ...status,
          editData: {
            ...status.editData,
            [field]: value
          }
        };
      }
      return status;
    }));
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('이 게재 기록을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('campaign_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      await loadCampaignPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const getStatusBadge = (status: CampaignPost['status']) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      posted: 'bg-blue-100 text-blue-800',
      deleted: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      pending: '대기중',
      posted: '게재중',
      deleted: '삭제됨',
      expired: '만료됨'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
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
        <h1 className="text-3xl font-bold text-gray-900">게재 현황</h1>
        <p className="text-gray-600 mt-2">캠페인별 채널 게재 현황과 성과를 관리합니다</p>
      </div>

      {/* Campaign Selection */}
      {!selectedCampaign ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">캠페인 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(campaign => (
                <button
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{campaign.name}</div>
                  {campaign.description && (
                    <div className="text-sm text-gray-500 mt-1">{campaign.description}</div>
                  )}
                  <div className="flex items-center mt-2 text-xs text-gray-400">
                    <Calendar size={12} className="mr-1" />
                    {campaign.start_date && campaign.end_date ? (
                      <span>
                        {format(new Date(campaign.start_date), 'yyyy-MM-dd')} ~ 
                        {format(new Date(campaign.end_date), 'yyyy-MM-dd')}
                      </span>
                    ) : (
                      <span>기간 미정</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status === 'planning' ? '계획중' :
                       campaign.status === 'active' ? '진행중' :
                       campaign.status === 'completed' ? '완료' : '취소됨'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>

          {/* Selected Campaign Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← 캠페인 목록으로
                </button>
                <ChevronRight className="text-gray-400" size={20} />
                <div>
                  <h2 className="text-xl font-semibold">{selectedCampaign.name}</h2>
                  {selectedCampaign.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedCampaign.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedCampaign.start_date && selectedCampaign.end_date && (
                  <span className="text-sm text-gray-500">
                    {format(new Date(selectedCampaign.start_date), 'yyyy-MM-dd')} ~ 
                    {format(new Date(selectedCampaign.end_date), 'yyyy-MM-dd')}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedCampaign.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  selectedCampaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedCampaign.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedCampaign.status === 'planning' ? '계획중' :
                   selectedCampaign.status === 'active' ? '진행중' :
                   selectedCampaign.status === 'completed' ? '완료' : '취소됨'}
                </span>
              </div>
            </div>
          </div>

          {/* Channel Posts Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      채널
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      게재 URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      게재일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      조회수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      클릭수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {channelPostStatuses.map((status) => {
                    const isEditing = status.isEditing;
                    const isSaving = savingIds.has(status.channel.id);
                    const data = isEditing ? status.editData : status.post;

                    return (
                      <tr key={status.channel.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {status.channel.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {status.channel.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="url"
                              value={data?.post_url || ''}
                              onChange={(e) => handleUpdateEditData(status.channel.id, 'post_url', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="https://..."
                            />
                          ) : data?.post_url ? (
                            <a
                              href={data.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center text-sm"
                            >
                              <ExternalLink size={14} className="mr-1" />
                              링크
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="date"
                              value={data?.posted_date || ''}
                              onChange={(e) => handleUpdateEditData(status.channel.id, 'posted_date', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : data?.posted_date ? (
                            <span className="text-sm">{format(new Date(data.posted_date), 'yyyy-MM-dd')}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={data?.view_count || 0}
                              onChange={(e) => handleUpdateEditData(status.channel.id, 'view_count', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm">{data?.view_count?.toLocaleString() || '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={data?.click_count || 0}
                              onChange={(e) => handleUpdateEditData(status.channel.id, 'click_count', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm">{data?.click_count?.toLocaleString() || '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              value={data?.registration_count || 0}
                              onChange={(e) => handleUpdateEditData(status.channel.id, 'registration_count', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm">{data?.registration_count?.toLocaleString() || '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={data?.status || 'pending'}
                              onChange={(e) => handleUpdateEditData(status.channel.id, 'status', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="pending">대기중</option>
                              <option value="posted">게재중</option>
                              <option value="deleted">삭제됨</option>
                              <option value="expired">만료됨</option>
                            </select>
                          ) : data?.status ? (
                            getStatusBadge(data.status)
                          ) : (
                            <span className="text-gray-400 text-sm">미등록</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isEditing ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleSavePost(status.channel.id)}
                                disabled={isSaving}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={() => handleCancelEdit(status.channel.id)}
                                disabled={isSaving}
                                className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              {status.post ? (
                                <>
                                  <button
                                    onClick={() => handleEditPost(status.channel.id, status.post)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(status.post!.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleEditPost(status.channel.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Plus size={18} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};