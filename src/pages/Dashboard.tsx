import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Campaign, CampaignPost } from '../types';
import { 
  Users, 
  Eye, 
  Target,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*, category:campaign_categories(*)');
      
      // Fetch posts with channel info
      const { data: postsData } = await supabase
        .from('campaign_posts')
        .select('*, channel:campaign_channels(*), campaign:campaigns(*)');

      setCampaigns(campaignsData || []);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalViews = posts.reduce((sum, post) => sum + post.view_count, 0);
  const totalRegistrations = posts.reduce((sum, post) => sum + post.registration_count, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const averageConversionRate = posts.length > 0
    ? posts.reduce((sum, post) => sum + (post.conversion_rate || 0), 0) / posts.length
    : 0;

  // Prepare chart data
  const performanceData = posts
    .slice(-7)
    .map(post => ({
      date: format(new Date(post.posted_date), 'MM/dd', { locale: ko }),
      조회수: post.view_count,
      등록수: post.registration_count,
      클릭수: post.click_count
    }));

  const channelData = posts.reduce((acc, post) => {
    const channelName = post.channel?.name || 'Unknown';
    if (!acc[channelName]) {
      acc[channelName] = { name: channelName, count: 0, views: 0 };
    }
    acc[channelName].count++;
    acc[channelName].views += post.view_count;
    return acc;
  }, {} as Record<string, { name: string; count: number; views: number }>);

  const topChannels = Object.values(channelData)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const statusData = [
    { name: '계획중', value: campaigns.filter(c => c.status === 'planning').length, color: '#94a3b8' },
    { name: '진행중', value: campaigns.filter(c => c.status === 'active').length, color: '#3b82f6' },
    { name: '완료', value: campaigns.filter(c => c.status === 'completed').length, color: '#10b981' },
    { name: '취소', value: campaigns.filter(c => c.status === 'cancelled').length, color: '#ef4444' }
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">캠페인 성과를 한눈에 확인하세요</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 조회수</p>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
            <Eye className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 등록수</p>
              <p className="text-2xl font-bold text-gray-900">{totalRegistrations.toLocaleString()}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">진행중 캠페인</p>
              <p className="text-2xl font-bold text-gray-900">{activeCampaigns}</p>
            </div>
            <Activity className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 전환율</p>
              <p className="text-2xl font-bold text-gray-900">{averageConversionRate.toFixed(2)}%</p>
            </div>
            <Target className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">성과 트렌드</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="조회수" stroke="#3b82f6" />
              <Line type="monotone" dataKey="클릭수" stroke="#10b981" />
              <Line type="monotone" dataKey="등록수" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">캠페인 상태</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Channels */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">상위 채널</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topChannels}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">최근 게재</h2>
          <div className="space-y-3">
            {posts.slice(0, 5).map(post => (
              <div key={post.id} className="flex items-center justify-between py-2 border-b">
                <div className="flex-1">
                  <p className="text-sm font-medium">{post.channel?.name}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(post.posted_date), 'yyyy-MM-dd', { locale: ko })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{post.view_count.toLocaleString()} 조회</p>
                  <p className="text-xs text-gray-500">{post.registration_count} 등록</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Campaigns Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">진행중인 캠페인</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  목표 조회수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  목표 등록수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.filter(c => c.status === 'active').map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.start_date && campaign.end_date ? (
                      <>
                        {format(new Date(campaign.start_date), 'MM/dd')} - {format(new Date(campaign.end_date), 'MM/dd')}
                      </>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.target_views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.target_registrations.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      진행중
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};