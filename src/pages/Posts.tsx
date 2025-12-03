import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Campaign, CampaignChannel, CampaignPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Users,
  MousePointer,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const Posts: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channels, setChannels] = useState<CampaignChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<CampaignPost | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    campaign_id: 0,
    channel_id: 0,
    post_url: '',
    title: '',
    content: '',
    posted_date: format(new Date(), 'yyyy-MM-dd'),
    deleted_date: '',
    view_count: 0,
    click_count: 0,
    registration_count: 0,
    status: 'pending' as CampaignPost['status'],
    result: undefined as CampaignPost['result'],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, campaignsRes, channelsRes] = await Promise.all([
        supabase
          .from('campaign_posts')
          .select('*, campaign:campaigns(*), channel:campaign_channels(*)')
          .order('posted_date', { ascending: false }),
        supabase
          .from('campaigns')
          .select('*')
          .order('name'),
        supabase
          .from('campaign_channels')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      setPosts(postsRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setChannels(channelsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const postData = {
      ...formData,
      posted_by: user?.id,
      deleted_date: formData.deleted_date || null,
      result: formData.result || null
    };

    try {
      if (editingPost) {
        const { error } = await supabase
          .from('campaign_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaign_posts')
          .insert([postData]);

        if (error) throw error;
      }

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 게재 기록을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('campaign_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEdit = (post: CampaignPost) => {
    setEditingPost(post);
    setFormData({
      campaign_id: post.campaign_id,
      channel_id: post.channel_id,
      post_url: post.post_url,
      title: post.title || '',
      content: post.content || '',
      posted_date: post.posted_date,
      deleted_date: post.deleted_date || '',
      view_count: post.view_count,
      click_count: post.click_count,
      registration_count: post.registration_count,
      status: post.status,
      result: post.result,
      notes: post.notes || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setFormData({
      campaign_id: 0,
      channel_id: 0,
      post_url: '',
      title: '',
      content: '',
      posted_date: format(new Date(), 'yyyy-MM-dd'),
      deleted_date: '',
      view_count: 0,
      click_count: 0,
      registration_count: 0,
      status: 'pending',
      result: undefined,
      notes: ''
    });
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

  const getResultBadge = (result?: CampaignPost['result']) => {
    if (!result) return null;
    const badges = {
      success: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };
    const labels = {
      success: '성공',
      moderate: '보통',
      poor: '저조'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[result]}`}>
        {labels[result]}
      </span>
    );
  };

  const filteredPosts = posts.filter(post => {
    const matchesCampaign = selectedCampaign === 'all' || post.campaign_id === parseInt(selectedCampaign);
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    return matchesCampaign && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">게재 현황</h1>
          <p className="text-gray-600 mt-2">캠페인 게재 현황과 성과를 관리합니다</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>게재 추가</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">캠페인</label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 캠페인</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="posted">게재중</option>
              <option value="deleted">삭제됨</option>
              <option value="expired">만료됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인 / 채널
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  게재일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  성과
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  전환율
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결과
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {post.campaign?.name || 'Unknown Campaign'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.channel?.name || 'Unknown Channel'}
                      </div>
                      {post.title && (
                        <div className="text-xs text-gray-400 mt-1">{post.title}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(post.posted_date), 'yyyy-MM-dd', { locale: ko })}
                    </div>
                    {post.deleted_date && (
                      <div className="text-xs text-red-500">
                        삭제: {format(new Date(post.deleted_date), 'yyyy-MM-dd')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Eye size={14} className="mr-1 text-gray-400" />
                        <span>{post.view_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MousePointer size={14} className="mr-1 text-gray-400" />
                        <span>{post.click_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users size={14} className="mr-1 text-gray-400" />
                        <span>{post.registration_count.toLocaleString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      <TrendingUp size={14} className="mr-1 text-gray-400" />
                      <span>{post.conversion_rate ? `${post.conversion_rate.toFixed(2)}%` : '0%'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(post.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getResultBadge(post.result)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 mr-3"
                    >
                      <ExternalLink size={18} />
                    </a>
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-semibold mb-4">
              {editingPost ? '게재 수정' : '새 게재 추가'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    캠페인 *
                  </label>
                  <select
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({ ...formData, campaign_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>선택하세요</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    채널 *
                  </label>
                  <select
                    value={formData.channel_id}
                    onChange={(e) => setFormData({ ...formData, channel_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>선택하세요</option>
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>{channel.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  게재 URL *
                </label>
                <input
                  type="url"
                  value={formData.post_url}
                  onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    게재일 *
                  </label>
                  <input
                    type="date"
                    value={formData.posted_date}
                    onChange={(e) => setFormData({ ...formData, posted_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    삭제일
                  </label>
                  <input
                    type="date"
                    value={formData.deleted_date}
                    onChange={(e) => setFormData({ ...formData, deleted_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CampaignPost['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">대기중</option>
                    <option value="posted">게재중</option>
                    <option value="deleted">삭제됨</option>
                    <option value="expired">만료됨</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    조회수
                  </label>
                  <input
                    type="number"
                    value={formData.view_count}
                    onChange={(e) => setFormData({ ...formData, view_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    클릭수
                  </label>
                  <input
                    type="number"
                    value={formData.click_count}
                    onChange={(e) => setFormData({ ...formData, click_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    등록수
                  </label>
                  <input
                    type="number"
                    value={formData.registration_count}
                    onChange={(e) => setFormData({ ...formData, registration_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결과
                  </label>
                  <select
                    value={formData.result || ''}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value as CampaignPost['result'] || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">미평가</option>
                    <option value="success">성공</option>
                    <option value="moderate">보통</option>
                    <option value="poor">저조</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
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
                  {editingPost ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};