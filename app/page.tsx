'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// 예약 데이터 타입 정의
interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time?: string;
  guest_count?: number;
  party_size?: number;
  customer_name: string;
  customer_phone?: string;
  manager?: string;
  staff_name?: string;
  created_at?: string;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'noshow' | string;
}

// 전화번호 자동 하이픈 포맷팅 함수
const formatPhoneNumber = (value: string) => {
  if (!value) return '';
  const raw = value.replace(/[^0-9]/g, '');

  if (raw.length === 11) {
    return raw.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (raw.length === 10) {
    if (raw.startsWith('02')) {
      return raw.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return raw.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (raw.length === 8) {
    return `010-${raw.slice(0, 4)}-${raw.slice(4)}`;
  }
  return value;
};

// 날짜 문자열(YYYY-MM-DD)을 기반으로 한글 요일을 반환하는 함수
const getDayOfWeek = (dateString: string) => {
  if (!dateString) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(`${dateString}T00:00:00`);
  if (isNaN(date.getTime())) return '';
  return days[date.getDay()];
};

// 예약 상태별 행(Row) 스타일 계산 함수
const getRowStyle = (status: string) => {
  switch (status) {
    case 'cancelled':
      return {
        backgroundColor: '#fef2f2',
        color: '#991b1b',
        textDecoration: 'line-through',
      };
    case 'noshow':
      return {
        backgroundColor: '#faf5ff',
        color: '#6b21a8',
        textDecoration: 'none',
      };
    case 'confirmed':
    default:
      return {
        backgroundColor: '#ffffff',
        color: '#1f2937',
        textDecoration: 'none',
      };
  }
};

export default function ReservationDashboard() {
  // 인증 관련 상태
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 예약 관련 상태
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(true);

  // 모달 및 예약 등록/수정 폼 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '11:00',
    customer_name: '',
    customer_phone: '',
    party_size: 2,
    guest_count: 2,
    manager: '',
    notes: '',
    status: 'confirmed',
  });

  // 세션 확인 및 로그인 상태 리스너 등록
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 예약 데이터 불러오기
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_time', { ascending: true });

      if (error) {
        console.error('Error fetching reservations:', error);
      } else if (data) {
        setReservations(data as Reservation[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  // 로그인 제출
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError('아이디(이메일) 또는 비밀번호가 올바르지 않습니다.');
    }
    setIsSubmitting(false);
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 예약 상태 변경 함수
  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
    } else {
      setReservations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    }
  };

  // 예약 삭제 함수
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } else {
      setReservations((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // 예약 신규 등록 모달 열기
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      reservation_date: selectedDate,
      reservation_time: '11:00',
      customer_name: '',
      customer_phone: '',
      party_size: 2,
      guest_count: 2,
      manager: '',
      notes: '',
      status: 'confirmed',
    });
    setIsModalOpen(true);
  };

  // 예약 수정 모달 열기
  const handleOpenEditModal = (item: Reservation) => {
    setEditingId(item.id);
    const guestNum = item.party_size ?? item.guest_count ?? 2;
    setFormData({
      reservation_date: item.reservation_date || selectedDate,
      reservation_time: item.reservation_time ? item.reservation_time.substring(0, 5) : '11:00',
      customer_name: item.customer_name || '',
      customer_phone: item.customer_phone || '',
      party_size: guestNum,
      guest_count: guestNum,
      manager: (item.manager || item.staff_name || '').toUpperCase(),
      notes: item.notes || '',
      status: item.status || 'confirmed',
    });
    setIsModalOpen(true);
  };

  // 폼 제출 (등록/수정)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name) {
      alert('성함을 입력해주세요.');
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.customer_phone);

    const payload = {
      ...formData,
      customer_phone: formattedPhone,
      manager: formData.manager.toUpperCase(),
      party_size: formData.guest_count,
      guest_count: formData.guest_count,
    };

    if (editingId) {
      const { error } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        alert('예약 수정 중 오류가 발생했습니다: ' + error.message);
      } else {
        alert('예약 정보가 수정되었습니다.');
        setIsModalOpen(false);
        fetchReservations();
      }
    } else {
      const { error } = await supabase
        .from('reservations')
        .insert([payload])
        .select();

      if (error) {
        alert('예약 등록 중 오류가 발생했습니다: ' + error.message);
      } else {
        alert('예약이 성공적으로 등록되었습니다.');
        setIsModalOpen(false);
        fetchReservations();
      }
    }
  };

  // 로딩 화면
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>인증 정보를 확인 중입니다...</p>
      </div>
    );
  }

  // 1. 로그인 화면
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#f3f4f6', 
        fontFamily: 'system-ui, -apple-system, sans-serif' 
      }}>
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '40px', 
          borderRadius: '16px', 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
          width: '100%', 
          maxWidth: '400px' 
        }}>
          <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            예약현황 관리자 로그인
          </h1>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>
            관리자 아이디와 비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                아이디 (이메일)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {loginError && (
              <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0 0', textAlign: 'center' }}>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 선택된 날짜 필터링
  const filteredReservations = reservations.filter(
    (item) => item.reservation_date === selectedDate
  );

  // 런치 / 디너 분리
  const lunchReservations = filteredReservations.filter((item) => {
    if (!item.reservation_time) return true;
    const hour = parseInt(item.reservation_time.substring(0, 2), 10);
    return hour < 17;
  });

  const dinnerReservations = filteredReservations.filter((item) => {
    if (!item.reservation_time) return false;
    const hour = parseInt(item.reservation_time.substring(0, 2), 10);
    return hour >= 17;
  });

  // 요약 정보 계산
  const getSummary = (list: Reservation[]) => {
    const totalCount = list.length;
    const totalGuests = list
      .filter((item) => item.status !== 'cancelled')
      .reduce((sum, item) => sum + (item.party_size ?? item.guest_count ?? 1), 0);
    return { totalCount, totalGuests };
  };

  const totalSummary = getSummary(filteredReservations);
  const lunchSummary = getSummary(lunchReservations);
  const dinnerSummary = getSummary(dinnerReservations);

  // 공통 예약 세션 목록 렌더링 함수
  const renderReservationTable = (title: string, list: Reservation[], summary: { totalCount: number; totalGuests: number }, badgeColor: string) => (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '28px' }}>
      <div style={{ 
        padding: '14px 20px', 
        backgroundColor: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            backgroundColor: badgeColor, 
            color: '#ffffff', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            padding: '4px 10px', 
            borderRadius: '20px' 
          }}>
            {title}
          </span>
          <h2 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 'bold' }}>
            {title === '런치' ? '런치' : '디너'}
          </h2>
        </div>
        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
          예약 <strong style={{ color: '#2563eb' }}>{summary.totalCount}</strong>건 / 인원 <strong style={{ color: '#2563eb' }}>{summary.totalGuests}</strong>명
        </span>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '70px 60px 90px 140px 90px 110px 1fr 100px 110px', 
        padding: '12px 16px', 
        backgroundColor: '#ffffff', 
        borderBottom: '1px solid #f1f5f9',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#64748b',
        alignItems: 'center'
      }}>
        <div>시간</div>
        <div>인원</div>
        <div>성함</div>
        <div>연락처</div>
        <div>담당자</div>
        <div>예약받은날짜</div>
        <div>요청사항</div>
        <div>상태</div>
        <div style={{ textAlign: 'center' }}>관리</div>
      </div>

      {list.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          {title} 예약 내역이 없습니다.
        </div>
      ) : (
        list.map((item) => {
          const rowStyle = getRowStyle(item.status);

          return (
            <div 
              key={item.id} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '70px 60px 90px 140px 90px 110px 1fr 100px 110px', 
                alignItems: 'center',
                padding: '14px 16px', 
                borderBottom: '1px solid #f1f5f9',
                fontSize: '14px',
                backgroundColor: rowStyle.backgroundColor,
                color: rowStyle.color,
                textDecoration: rowStyle.textDecoration,
                transition: 'background-color 0.2s ease',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{item.reservation_time ? item.reservation_time.substring(0, 5) : '-'}</div>
              <div>{item.party_size ?? item.guest_count ?? 1}명</div>
              <div style={{ fontWeight: '600' }}>{item.customer_name}</div>
              <div style={{ fontSize: '13px' }}>{item.customer_phone ? formatPhoneNumber(item.customer_phone) : '-'}</div>
              <div style={{ fontSize: '13px', textTransform: 'uppercase' }}>{item.manager || item.staff_name || '-'}</div>
              <div style={{ fontSize: '12px', opacity: 0.75 }}>{item.created_at ? item.created_at.substring(0, 10) : '-'}</div>
              <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.notes || '-'}</div>

              <div>
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid #d1d5db',
                    backgroundColor: 
                      item.status === 'confirmed' ? '#dcfce7' :
                      item.status === 'cancelled' ? '#fee2e2' :
                      item.status === 'noshow' ? '#f3e8ff' : '#ffffff',
                    color: 
                      item.status === 'confirmed' ? '#166534' :
                      item.status === 'cancelled' ? '#991b1b' :
                      item.status === 'noshow' ? '#6b21a8' : '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <option value="confirmed">확정</option>
                  <option value="cancelled">취소</option>
                  <option value="noshow">노쇼</option>
                </select>
              </div>

              <div style={{ textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleOpenEditModal(item)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #fca5a5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // 2. 메인 예약현황 대시보드 화면
  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 상단 헤더 영역 */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827', fontWeight: 'bold' }}>
              예약현황
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              실시간 예약 현황을 한눈에 확인하고 관리하세요. ({user.email})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleOpenCreateModal}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              + 예약 등록
            </button>

            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 날짜 선택 필터 */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label htmlFor="date-select" style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
            날짜 선택:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
              }}
            />
            {selectedDate && (
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                color: getDayOfWeek(selectedDate) === '토' ? '#2563eb' : getDayOfWeek(selectedDate) === '일' ? '#ef4444' : '#1f2937',
                backgroundColor: '#f3f4f6',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                ({getDayOfWeek(selectedDate)}요일)
              </span>
            )}
          </div>
          <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>
            [전체] (예약 <strong style={{ color: '#2563eb' }}>{totalSummary.totalCount}</strong>건 / 인원 <strong style={{ color: '#2563eb' }}>{totalSummary.totalGuests}</strong>명)
          </span>
        </div>
      </div>

      {/* 예약 목록 영역 (런치 / 디너) */}
      {loading ? (
        <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          예약 내역을 불러오는 중입니다...
        </div>
      ) : (
        <>
          {renderReservationTable('런치', lunchReservations, lunchSummary, '#f59e0b')}
          {renderReservationTable('디너', dinnerReservations, dinnerSummary, '#6366f1')}
        </>
      )}

      {/* 예약 등록 / 수정 모달 팝업 */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#111827' }}>
              {editingId ? '예약 정보 수정' : '예약 등록'}
            </h2>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* [첫 번째 줄] 예약 날짜 / 예약 시간 / 인원수 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1.2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>예약 날짜</label>
                    {formData.reservation_date && (
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        color: getDayOfWeek(formData.reservation_date) === '토' ? '#2563eb' : getDayOfWeek(formData.reservation_date) === '일' ? '#ef4444' : '#4b5563'
                      }}>
                        ({getDayOfWeek(formData.reservation_date)}요일)
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }}
                    required
                  />
                </div>

                <div style={{ flex: 1.2 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>예약 시간</label>
                  <input
                    type="time"
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }}
                    required
                  />
                </div>

                <div style={{ flex: 0.8 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>인원수</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.guest_count}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setFormData({ ...formData, guest_count: count, party_size: count });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              {/* [두 번째 줄] 성함 / 연락처 / 담당자 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>성함</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }}
                    placeholder="고객명 / 기업명"
                    required
                  />
                </div>

                <div style={{ flex: 1.2 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>연락처</label>
                  <input
                    type="text"
                    value={formData.customer_phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setFormData({ ...formData, customer_phone: formatted });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }}
                    placeholder="연락처 확인 필수"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>담당자</label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px', textTransform: 'uppercase' }}
                    placeholder="담당 직원 이름"
                  />
                </div>
              </div>

              {/* [세 번째 줄] 요청사항 / 메모 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>요청사항 / 메모</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ccc', height: '65px', boxSizing: 'border-box', fontSize: '13px', resize: 'vertical' }}
                  placeholder="선주문 안할 경우 음식 제공까지 20분 이상 소요 될 수 있음 안내"
                />
              </div>

              {/* 하단 버튼 영역 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {editingId ? '수정 완료' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}