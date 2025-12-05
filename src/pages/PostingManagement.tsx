import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Save, CheckCircle, XCircle, Clock, DollarSign, Eye, Users, ArrowLeft, Megaphone } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  target_views?: number;
  target_registrations?: number;
  budget?: number;
  created_at: string;
}

interface ChannelType {
  id: number;
  code: string;
  name: string;
  description: string;
  color: string;
}

interface Channel {
  id: number;
  channel_type_id: number;
  name: string;
  url?: string;
  member_count?: number;
}

interface Posting {
  id?: number;
  campaign_id: number;
  channel_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  memo?: string;
  posted_date?: string;
  metrics?: {
    views?: number;
    clicks?: number;
    conversions?: number;
  };
}

export const PostingManagement: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [postings, setPostings] = useState<Record<number, Posting>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campaignStats, setCampaignStats] = useState<any>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      fetchChannelTypes();
    } else {
      fetchCampaigns();
    }
  }, [campaignId]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignStats();
      fetchPostings();
      // Select first channel type by default
      if (channelTypes.length > 0 && !selectedType) {
        setSelectedType(channelTypes[0]);
      }
    }
  }, [selectedCampaign, channelTypes]);

  useEffect(() => {
    if (selectedType && selectedCampaign) {
      fetchChannels();
    }
  }, [selectedType, selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      
      if (error) throw error;
      setSelectedCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      navigate('/posts');
    }
  };

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

  const fetchPostings = async () => {
    if (!selectedCampaign) return;
    
    try {
      const { data, error } = await supabase
        .from('campaign_postings')
        .select('*')
        .eq('campaign_id', selectedCampaign.id);
      
      if (error) {
        console.log('Postings table may not exist yet');
        return;
      }
      
      const postingsMap: Record<number, Posting> = {};
      (data || []).forEach((posting: any) => {
        postingsMap[posting.channel_id] = posting;
      });
      setPostings(postingsMap);
    } catch (error) {
      console.error('Error fetching postings:', error);
    }
  };

  const fetchCampaignStats = async () => {
    if (!selectedCampaign) return;
    
    try {
      const { data, error } = await supabase
        .from('campaign_postings')
        .select('status')
        .eq('campaign_id', selectedCampaign.id);
      
      if (error) {
        setCampaignStats({
          total: 0,
          completed: 0,
          in_progress: 0,
          pending: 0,
          failed: 0
        });
        return;
      }
      
      const stats = {
        total: data?.length || 0,
        completed: data?.filter((p: any) => p.status === 'completed').length || 0,
        in_progress: data?.filter((p: any) => p.status === 'in_progress').length || 0,
        pending: data?.filter((p: any) => p.status === 'pending').length || 0,
        failed: data?.filter((p: any) => p.status === 'failed').length || 0,
      };
      
      setCampaignStats(stats);
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    }
  };

  const handlePostingUpdate = (channelId: number, field: string, value: any) => {
    setPostings(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        campaign_id: selectedCampaign!.id,
        channel_id: channelId,
        [field]: value
      }
    }));
  };

  const savePosting = async (channelId: number) => {
    if (!selectedCampaign) return;
    
    setSaving(true);
    try {
      const posting = postings[channelId] || {
        campaign_id: selectedCampaign.id,
        channel_id: channelId,
        status: 'pending'
      };
      
      const { error } = await supabase
        .from('campaign_postings')
        .upsert(posting, {
          onConflict: 'campaign_id,channel_id'
        });
      
      if (error) throw error;
      
      alert('저장되었습니다.');
      fetchCampaignStats();
    } catch (error) {
      console.error('Error saving posting:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'in_progress':
        return <Clock className="text-yellow-600" size={20} />;
      case 'failed':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'completed':
        return '완료';
      case 'paused':
        return '일시중지';
      case 'planning':
        return '기획중';
      default:
        return status;
    }
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    navigate(`/posts/${campaign.id}`);
  };

  // Show campaign selection if no campaign is selected
  if (!campaignId || !selectedCampaign) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">게재 관리</h1>
          <p className="text-gray-600 mt-2">캠페인별 채널 게재 현황을 관리합니다.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6">캠페인 선택</h2>
          
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => handleCampaignSelect(campaign)}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{campaign.name}</h3>
                    <p className="text-gray-600 mt-1">{campaign.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {getStatusLabel(campaign.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{format(new Date(campaign.start_date), 'yyyy-MM-dd')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Eye className="w-4 h-4 mr-2" />
                    <span>목표 {campaign.target_views?.toLocaleString() || 0} 조회</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>목표 {campaign.target_registrations?.toLocaleString() || 0} 등록</span>
                  </div>
                  {campaign.budget && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>{campaign.budget.toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {campaigns.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
              <p>등록된 캠페인이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">게재 관리</h1>
        <p className="text-gray-600 mt-2">캠페인별 채널 게재 현황을 관리합니다.</p>
      </div>

      {/* Campaign Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <button
              onClick={() => navigate('/posts')}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm mb-2"
            >
              <ArrowLeft size={16} className="mr-1" />
              캠페인 목록으로
            </button>
            <h2 className="text-2xl font-bold">{selectedCampaign.name}</h2>
            <p className="text-gray-600 mt-1">{selectedCampaign.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCampaign.status)}`}>
            {getStatusLabel(selectedCampaign.status)}
          </span>
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{format(new Date(selectedCampaign.start_date), 'yyyy-MM-dd')} ~ {format(new Date(selectedCampaign.end_date), 'yyyy-MM-dd')}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Eye className="w-4 h-4 mr-2" />
            <span>목표 {selectedCampaign.target_views?.toLocaleString() || 0} 조회</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>목표 {selectedCampaign.target_registrations?.toLocaleString() || 0} 등록</span>
          </div>
          {selectedCampaign.budget && (
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>{selectedCampaign.budget.toLocaleString()}원</span>
            </div>
          )}
        </div>

        {/* Campaign Stats */}
        {campaignStats && (
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{campaignStats.total}</div>
              <div className="text-sm text-gray-500">전체 채널</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{campaignStats.completed}</div>
              <div className="text-sm text-gray-500">완료</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{campaignStats.in_progress}</div>
              <div className="text-sm text-gray-500">진행중</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{campaignStats.pending}</div>
              <div className="text-sm text-gray-500">대기</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{campaignStats.failed}</div>
              <div className="text-sm text-gray-500">실패</div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Management Section */}
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

        {/* Channels Content */}
        <div className="p-6">
          {selectedType ? (
            loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : channels.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">{selectedType.name} 채널 게재 관리</h3>
                {channels.map((channel) => {
                  const posting = postings[channel.id];
                  return (
                    <div key={channel.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusIcon(posting?.status)}
                            <h4 className="font-medium text-lg">{channel.name}</h4>
                            {channel.url && (
                              <a
                                href={channel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                링크
                              </a>
                            )}
                            {channel.member_count && (
                              <span className="text-sm text-gray-500">
                                회원 {channel.member_count.toLocaleString()}명
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                게재 상태
                              </label>
                              <select
                                value={posting?.status || 'pending'}
                                onChange={(e) => handlePostingUpdate(channel.id, 'status', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">대기</option>
                                <option value="in_progress">진행중</option>
                                <option value="completed">완료</option>
                                <option value="failed">실패</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                게재일
                              </label>
                              <input
                                type="date"
                                value={posting?.posted_date || ''}
                                onChange={(e) => handlePostingUpdate(channel.id, 'posted_date', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              결과
                            </label>
                            <input
                              type="text"
                              value={posting?.result || ''}
                              onChange={(e) => handlePostingUpdate(channel.id, 'result', e.target.value)}
                              placeholder="게재 결과를 입력하세요"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              메모
                            </label>
                            <textarea
                              value={posting?.memo || ''}
                              onChange={(e) => handlePostingUpdate(channel.id, 'memo', e.target.value)}
                              placeholder="메모를 입력하세요"
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={2}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => savePosting(channel.id)}
                          disabled={saving}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                        >
                          <Save size={16} />
                          저장
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                이 유형에 등록된 채널이 없습니다.
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              상단에서 채널 유형을 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};