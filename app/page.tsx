'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정 (환경 변수가 없을 경우 기본값 처리)
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
  const raw = value.replace(/[^0-9]/g, ''); // 숫자만 추출

  if (raw.length === 11) {
    return raw.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (raw.length === 10) {
    if (raw.startsWith('02')) {
      return raw.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return raw.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (raw.length === 8) {
    // 00000000 식 입력 시 010-0000-0000 형태로 변환
    return `010-${raw.slice(0, 4)}-${raw.slice(4)}`;
  }
  return value;
};

export default function ReservationDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(true);

  // 모달 및 수동 예약 폼 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '18:00',
    customer_name: '',
    customer_phone: '',
    party_size: 2,
    guest_count: 2,
    manager: '',
    notes: '',
    status: 'confirmed',
  });

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
    fetchReservations();
  }, []);

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

  // 수동 예약 추가 제출
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
      party_size: formData.guest_count,
      guest_count: formData.guest_count,
    };

    const { error } = await supabase
      .from('reservations')
      .insert([payload])
      .select();

    if (error) {
      alert('예약 등록 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert('예약이 성공적으로 등록되었습니다.');
      setIsModalOpen(false);
      setFormData({
        reservation_date: selectedDate,
        reservation_time: '18:00',
        customer_name: '',
        customer_phone: '',
        party_size: 2,
        guest_count: 2,
        manager: '',
        notes: '',
        status: 'confirmed',
      });
      fetchReservations();
    }
  };

  // 선택된 날짜의 예약 필터링
  const filteredReservations = reservations.filter(
    (item) => item.reservation_date === selectedDate
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 상단 헤더 및 기능 영역 */}
      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827', fontWeight: 'bold' }}>
              꽃새담 여의도 예약현황
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              실시간 예약 현황을 한눈에 확인하고 관리하세요.
            </p>
          </div>

          <button
            onClick={() => {
              setFormData((prev) => ({ ...prev, reservation_date: selectedDate }));
              setIsModalOpen(true);
            }}
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
            + 수동 예약 등록
          </button>
        </div>

        {/* 날짜 선택 필터 */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="date-select" style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
            날짜 선택:
          </label>
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
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            (총 <strong style={{ color: '#2563eb' }}>{filteredReservations.length}</strong>건)
          </span>
        </div>
      </div>

      {/* 예약 목록 (노트식 한 줄 레이아웃) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {/* 상단 헤더 행 (시간 / 인원 / 성함 / 연락처 / 담당자 / 예약받은날짜 / 요청사항 / 상태 / 관리) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '70px 60px 90px 140px 90px 110px 1fr 100px 70px', 
          padding: '12px 16px', 
          backgroundColor: '#f9fafb', 
          borderBottom: '1px solid #e5e7eb',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#4b5563',
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

        {/* 목록 데이터 출력 */}
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
            예약 내역을 불러오는 중입니다...
          </div>
        ) : filteredReservations.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
            선택하신 날짜에 예약 내역이 없습니다.
          </div>
        ) : (
          filteredReservations.map((item) => (
            <div 
              key={item.id} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '70px 60px 90px 140px 90px 110px 1fr 100px 70px', 
                alignItems: 'center',
                padding: '14px 16px', 
                borderBottom: '1px solid #f3f4f6',
                fontSize: '14px',
                color: '#1f2937'
              }}
            >
              {/* 1. 시간 */}
              <div style={{ fontWeight: 'bold', color: '#2563eb' }}>
                {item.reservation_time ? item.reservation_time.substring(0, 5) : '-'}
              </div>

              {/* 2. 인원 */}
              <div>{item.party_size ?? item.guest_count ?? 1}명</div>

              {/* 3. 성함 */}
              <div style={{ fontWeight: '600' }}>{item.customer_name}</div>

              {/* 4. 연락처 (자동 포맷팅 적용) */}
              <div style={{ color: '#4b5563', fontSize: '13px' }}>
                {item.customer_phone ? formatPhoneNumber(item.customer_phone) : '-'}
              </div>

              {/* 5. 담당자 */}
              <div style={{ color: '#374151', fontSize: '13px' }}>{item.manager || item.staff_name || '-'}</div>

              {/* 6. 예약받은날짜 */}
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                {item.created_at ? item.created_at.substring(0, 10) : '-'}
              </div>

              {/* 7. 요청사항 */}
              <div style={{ color: '#6b7280', fontSize: '13px', paddingRight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.notes || '-'}
              </div>

              {/* 8. 상태 선택 드롭다운 (확정 / 취소 / 노쇼) */}
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
                      item.status === 'noshow' ? '#f3e8ff' : '#f3f4f6',
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

              {/* 9. 삭제 버튼 */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #fca5a5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 수동 예약 등록 모달 팝업 */}
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
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>수동 예약 등록</h2>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>예약 날짜</label>
                  <input
                    type="date"
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>예약 시간</label>
                  <input
                    type="time"
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>성함</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>인원수</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.guest_count}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setFormData({ ...formData, guest_count: count, party_size: count });
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>연락처</label>
                <input
                  type="text"
                  value={formData.customer_phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData({ ...formData, customer_phone: formatted });
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                  placeholder="010-0000-0000 또는 00000000"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>담당자</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                  placeholder="담당 직원 이름"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>요청사항 / 메모</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', height: '60px' }}
                  placeholder="창가 자리 희망 등"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}