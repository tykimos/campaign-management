import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Campaign, CampaignPost, CampaignChannel } from '../types';
import {
  TrendingUp,
  Users,
  Eye,
  Target,
  Calendar,
  Award,
  AlertCircle,
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
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

export const Analytics: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [channels, setChannels] = useState<CampaignChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      let startDate = subDays(new Date(), 30);
      if (dateRange === '7days') startDate = subDays(new Date(), 7);
      else if (dateRange === 'month') startDate = startOfMonth(new Date());
      else if (dateRange === '90days') startDate = subDays(new Date(), 90);

      const [campaignsRes, postsRes, channelsRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*, category:campaign_categories(*)'),
        supabase
          .from('campaign_posts')
          .select('*, campaign:campaigns(*), channel:campaign_channels(*)')
          .gte('posted_date', startDate.toISOString()),
        supabase
          .from('campaign_channels')
          .select('*')
      ]);

      setCampaigns(campaignsRes.data || []);
      setPosts(postsRes.data || []);
      setChannels(channelsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = selectedCampaign === 'all' 
    ? posts 
    : posts.filter(p => p.campaign_id === parseInt(selectedCampaign));

  // Calculate metrics
  const totalViews = filteredPosts.reduce((sum, p) => sum + p.view_count, 0);
  const totalClicks = filteredPosts.reduce((sum, p) => sum + p.click_count, 0);
  const totalRegistrations = filteredPosts.reduce((sum, p) => sum + p.registration_count, 0);
  const avgConversionRate = filteredPosts.length > 0
    ? filteredPosts.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / filteredPosts.length
    : 0;

  // Daily trend data
  const dailyData: Record<string, any> = {};
  filteredPosts.forEach(post => {
    const date = format(new Date(post.posted_date), 'yyyy-MM-dd');
    if (!dailyData[date]) {
      dailyData[date] = { date, views: 0, clicks: 0, registrations: 0 };
    }
    dailyData[date].views += post.view_count;
    dailyData[date].clicks += post.click_count;
    dailyData[date].registrations += post.registration_count;
  });
  const trendData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

  // Channel performance
  const channelPerformance: Record<string, any> = {};
  filteredPosts.forEach(post => {
    const channelName = post.channel?.name || 'Unknown';
    if (!channelPerformance[channelName]) {
      channelPerformance[channelName] = {
        name: channelName,
        posts: 0,
        views: 0,
        clicks: 0,
        registrations: 0,
        avgConversion: 0
      };
    }
    channelPerformance[channelName].posts++;
    channelPerformance[channelName].views += post.view_count;
    channelPerformance[channelName].clicks += post.click_count;
    channelPerformance[channelName].registrations += post.registration_count;
  });

  const channelData = Object.values(channelPerformance).map(channel => ({
    ...channel,
    avgConversion: channel.views > 0 ? (channel.registrations / channel.views * 100) : 0
  })).sort((a, b) => b.views - a.views).slice(0, 10);

  // Campaign comparison
  const campaignComparison = campaigns.map(campaign => {
    const campaignPosts = posts.filter(p => p.campaign_id === campaign.id);
    const views = campaignPosts.reduce((sum, p) => sum + p.view_count, 0);
    const registrations = campaignPosts.reduce((sum, p) => sum + p.registration_count, 0);
    const progress = campaign.target_views > 0 ? (views / campaign.target_views * 100) : 0;
    
    return {
      name: campaign.name,
      목표달성률: Math.min(progress, 100),
      실제조회수: views,
      목표조회수: campaign.target_views,
      등록수: registrations
    };
  }).filter(c => c.실제조회수 > 0);

  // Top performing posts
  const topPosts = [...filteredPosts]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5);

  // Category distribution
  const categoryDist: Record<string, number> = {};
  filteredPosts.forEach(post => {
    const category = post.channel?.category || 'unknown';
    categoryDist[category] = (categoryDist[category] || 0) + 1;
  });
  
  const categoryData = Object.entries(categoryDist).map(([name, value]) => ({
    name: name === 'contest' ? '공모전' : 
          name === 'community' ? '커뮤니티' : 
          name === 'sns' ? 'SNS' : 
          name === 'event' ? '이벤트' : name,
    value
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
          <h1 className="text-3xl font-bold text-gray-900">성과 분석</h1>
          <p className="text-gray-600 mt-2">캠페인 성과를 분석하고 인사이트를 얻으세요</p>
        </div>
        <div className="flex gap-4">
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
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="month">이번 달</option>
            <option value="90days">최근 90일</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 조회수</p>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">게시물 {filteredPosts.length}개</p>
            </div>
            <Eye className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 클릭수</p>
              <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">CTR {totalViews > 0 ? (totalClicks / totalViews * 100).toFixed(2) : 0}%</p>
            </div>
            <Activity className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 등록수</p>
              <p className="text-2xl font-bold text-gray-900">{totalRegistrations.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">전환율 {avgConversionRate.toFixed(2)}%</p>
            </div>
            <Users className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 효율</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalViews > 0 ? Math.round(totalRegistrations / filteredPosts.length) : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">게시물당 등록수</p>
            </div>
            <Target className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">일별 성과 추이</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MM/dd')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'yyyy-MM-dd')}
              />
              <Legend />
              <Line type="monotone" dataKey="views" name="조회수" stroke="#3b82f6" />
              <Line type="monotone" dataKey="clicks" name="클릭수" stroke="#10b981" />
              <Line type="monotone" dataKey="registrations" name="등록수" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">카테고리별 분포</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">채널별 성과</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={channelData.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" name="조회수" fill="#3b82f6" />
              <Bar dataKey="registrations" name="등록수" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">캠페인 목표 달성률</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignComparison} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="목표달성률" fill="#3b82f6">
                {campaignComparison.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.목표달성률 >= 100 ? '#10b981' : 
                          entry.목표달성률 >= 70 ? '#f59e0b' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Posts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">상위 성과 게시물</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인 / 채널
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
                  전환율
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topPosts.map((post, index) => (
                <tr key={post.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {post.campaign?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.channel?.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(post.posted_date), 'yyyy-MM-dd')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{post.view_count.toLocaleString()}</span>
                      {index === 0 && <Award className="ml-2 text-yellow-500" size={16} />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.click_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.registration_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      (post.conversion_rate || 0) > avgConversionRate ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {post.conversion_rate?.toFixed(2) || '0.00'}%
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