import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key to bypass RLS
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function insertData() {
  try {
    console.log('Starting data insertion...');
    
    // First, get any user or create a default user ID
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    let adminUserId;
    
    if (userError || !users || users.length === 0) {
      console.log('No users found, using a default UUID');
      // Use a fixed UUID for testing
      adminUserId = '00000000-0000-0000-0000-000000000000';
    } else {
      adminUserId = users[0].id;
      console.log('Using existing user ID:', adminUserId);
    }
    
    // Insert campaign (without created_by if no user exists)
    const campaignData = {
      name: '2025 NIA 딥페이크 범죄 대응을 위한 AI 탐지 모델 경진대회',
      description: 'NIA 주최 딥페이크 탐지 AI 모델 개발 경진대회 홍보 캠페인',
      status: 'active',
      start_date: '2024-11-01',
      end_date: '2025-01-31',
      target_views: 500000,
      target_registrations: 1000,
      budget: 0
    };
    
    // Only add created_by if we have a valid user
    if (adminUserId !== '00000000-0000-0000-0000-000000000000') {
      campaignData.created_by = adminUserId;
    }
    
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single();
    
    if (campaignError) {
      console.error('Error inserting campaign:', campaignError);
      return;
    }
    
    console.log('Campaign created with ID:', campaign.id);
    
    // Define channels data based on Excel categories
    const channelsData = [
      // AIF플랫폼
      { name: 'AIF 공식', category: 'AIF플랫폼', url: 'https://aif.or.kr' },
      { name: '데이콘', category: 'AIF플랫폼', url: 'https://dacon.io' },
      { name: '캐글', category: 'AIF플랫폼', url: 'https://kaggle.com' },
      // 정부기관
      { name: 'NIA 공식', category: '정부기관', url: 'https://www.nia.or.kr' },
      { name: '과기정통부', category: '정부기관', url: 'https://www.msit.go.kr' },
      // 공모전
      { name: '씽굿', category: '공모전', url: 'https://www.thinkcontest.com' },
      { name: '위비티', category: '공모전', url: 'https://www.wevity.com' },
      { name: '공모전닷컴', category: '공모전', url: 'https://www.contest.or.kr' },
      // 포털카페
      { name: '네이버 AI 카페', category: '포털카페', url: 'https://cafe.naver.com' },
      { name: '다음 머신러닝 카페', category: '포털카페', url: 'https://cafe.daum.net' },
      // SNS그룹
      { name: '페이스북 AI 그룹', category: 'SNS그룹', url: 'https://facebook.com/groups' },
      { name: '링크드인 AI 그룹', category: 'SNS그룹', url: 'https://linkedin.com' },
      // 커뮤니티
      { name: 'OKKY', category: '커뮤니티', url: 'https://okky.kr' },
      { name: '클리앙', category: '커뮤니티', url: 'https://www.clien.net' },
      // 오픈단톡방
      { name: 'AI 연구 오픈채팅', category: '오픈단톡방', url: 'https://open.kakao.com' },
      { name: '딥러닝 스터디', category: '오픈단톡방', url: 'https://open.kakao.com' },
      // 디스코드
      { name: 'AI Korea Discord', category: '디스코드', url: 'https://discord.gg' },
      // 대학원공문/대학교공문
      { name: '서울대 AI대학원', category: '대학원공문', url: 'https://snu.ac.kr' },
      { name: 'KAIST AI대학원', category: '대학원공문', url: 'https://kaist.ac.kr' },
      { name: '연세대 컴퓨터과학과', category: '대학교공문', url: 'https://yonsei.ac.kr' },
      { name: '고려대 AI학과', category: '대학교공문', url: 'https://korea.ac.kr' },
      // DM
      { name: '이메일 DM', category: 'DM', url: 'mailto:' },
      { name: '카카오톡 DM', category: 'DM', url: 'https://kakao.com' },
      // 기타
      { name: '육아맘고', category: '기타', url: '#' },
      { name: '퍼포먼스', category: '기타', url: '#' },
      { name: '이벤트', category: '기타', url: '#' }
    ];
    
    // Insert channels
    const channelsToInsert = [];
    for (const channelData of channelsData) {
      // Check if channel already exists
      const { data: existingChannel } = await supabase
        .from('campaign_channels')
        .select('id')
        .eq('name', channelData.name)
        .single();
      
      if (!existingChannel) {
        const channelToInsert = {
          name: channelData.name,
          category: channelData.category,
          url: channelData.url,
          is_active: true,
          description: `${channelData.name} 채널`
        };
        if (adminUserId !== '00000000-0000-0000-0000-000000000000') {
          channelToInsert.created_by = adminUserId;
        }
        channelsToInsert.push(channelToInsert);
      }
    }
    
    if (channelsToInsert.length > 0) {
      const { error: channelError } = await supabase
        .from('campaign_channels')
        .insert(channelsToInsert);
      
      if (channelError) {
        console.error('Error inserting channels:', channelError);
        return;
      }
      console.log(`Inserted ${channelsToInsert.length} channels`);
    }
    
    // Get all channels for posts
    const { data: allChannels, error: channelFetchError } = await supabase
      .from('campaign_channels')
      .select('id, name, category');
    
    if (channelFetchError) {
      console.error('Error fetching channels:', channelFetchError);
      return;
    }
    
    // Create posts based on Excel data
    const postsData = [];
    
    // AIF플랫폼 posts (8 posts, 129602 total views)
    const aifChannels = allChannels.filter(ch => ch.category === 'AIF플랫폼').slice(0, 3);
    aifChannels.forEach((ch, idx) => {
      const views = idx === 0 ? 50000 : idx === 1 ? 45000 : 34602;
      const postData = {
        campaign_id: campaign.id,
        channel_id: ch.id,
        post_url: `https://example.com/post/${ch.id}`,
        title: '딥페이크 AI 탐지 모델 경진대회 참가 안내',
        posted_date: '2024-11-15',
        view_count: views,
        click_count: Math.floor(views * 0.05),
        registration_count: Math.floor(views * 0.003),
        status: 'posted'
      };
      if (adminUserId !== '00000000-0000-0000-0000-000000000000') {
        postData.posted_by = adminUserId;
      }
      postsData.push(postData);
    });
    
    // 정부기관 posts (1 post, 148 views)
    const govChannel = allChannels.find(ch => ch.name === 'NIA 공식');
    if (govChannel) {
      const postData = {
        campaign_id: campaign.id,
        channel_id: govChannel.id,
        post_url: `https://example.com/post/${govChannel.id}`,
        title: 'NIA 딥페이크 탐지 경진대회 공고',
        posted_date: '2024-11-10',
        view_count: 148,
        click_count: 15,
        registration_count: 5,
        status: 'posted'
      };
      if (adminUserId !== '00000000-0000-0000-0000-000000000000') {
        postData.posted_by = adminUserId;
      }
      postsData.push(postData);
    }
    
    // Helper function to create post data
    const createPostData = (campaign, channel, title, date, views, clickRate, regRate) => {
      const postData = {
        campaign_id: campaign.id,
        channel_id: channel.id,
        post_url: `https://example.com/post/${channel.id}`,
        title: title,
        posted_date: date,
        view_count: views,
        click_count: Math.floor(views * clickRate),
        registration_count: Math.floor(views * regRate),
        status: 'posted'
      };
      if (adminUserId !== '00000000-0000-0000-0000-000000000000') {
        postData.posted_by = adminUserId;
      }
      return postData;
    };
    
    // 공모전 posts (16 posts, 37980 total views)
    const contestChannels = allChannels.filter(ch => ch.category === '공모전');
    contestChannels.forEach((ch, idx) => {
      const views = idx === 0 ? 15000 : idx === 1 ? 12000 : 10980;
      postsData.push(createPostData(
        campaign, ch,
        '총 상금 1억원! NIA 딥페이크 AI 경진대회',
        '2024-11-12', views, 0.053, 0.004
      ));
    });
    
    // 포털카페 posts (116 posts, 509 total views)
    const cafeChannels = allChannels.filter(ch => ch.category === '포털카페');
    cafeChannels.forEach((ch, idx) => {
      const views = idx === 0 ? 300 : 209;
      postsData.push(createPostData(
        campaign, ch,
        '[홍보] 딥페이크 탐지 AI 경진대회 참가자 모집',
        '2024-11-20', views, 0.1, 0.01
      ));
    });
    
    // SNS그룹 posts (8 posts, 113 total views)
    const snsChannels = allChannels.filter(ch => ch.category === 'SNS그룹');
    snsChannels.forEach((ch, idx) => {
      const views = idx === 0 ? 70 : 43;
      postsData.push(createPostData(
        campaign, ch,
        'AI 전문가 여러분, 딥페이크 탐지 경진대회에 도전하세요!',
        '2024-11-18', views, 0.11, 0.01
      ));
    });
    
    // 커뮤니티 posts (14 posts, 2619 total views)
    const communityChannels = allChannels.filter(ch => ch.category === '커뮤니티');
    communityChannels.forEach((ch, idx) => {
      const views = idx === 0 ? 1500 : 1119;
      postsData.push(createPostData(
        campaign, ch,
        '[경진대회] NIA 딥페이크 범죄 대응 AI 모델 개발 챌린지',
        '2024-11-16', views, 0.08, 0.008
      ));
    });
    
    // Insert all posts
    if (postsData.length > 0) {
      const { error: postError } = await supabase
        .from('campaign_posts')
        .insert(postsData);
      
      if (postError) {
        console.error('Error inserting posts:', postError);
        return;
      }
      console.log(`Inserted ${postsData.length} posts`);
    }
    
    console.log('Data insertion completed successfully!');
    console.log(`Campaign: ${campaign.name}`);
    console.log(`Total channels: ${allChannels.length}`);
    console.log(`Total posts: ${postsData.length}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

insertData();