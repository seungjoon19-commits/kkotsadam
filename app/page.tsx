'use client';

import React, { useState, useEffect } from 'react';
import { supabase, Reservation, ReservationStatus } from '@/lib/supabase';

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 수동 입력 폼 상태
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    reservation_time: '18:00',
    party_size: 2,
    memo: '',
  });

  // 예약 목록 조회
  const fetchReservations = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('reservation_date', selectedDate)
        .order('reservation_time', { ascending: true });

      if (error) {
        console.error('Supabase fetch error:', error);
        setErrorMessage(`데이터 조회 실패: ${error.message}`);
      } else {
        setReservations(data || []);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMessage(`오류 발생: ${err.message || '네트워크 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedDate]);

  // 통계 계산
  const totalCount = reservations.length;
  const totalPartySize = reservations
    .filter((r) => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.party_size, 0);
  const completedCount = reservations.filter((r) => r.status === 'COMPLETED').length;
  const noshowCount = reservations.filter((r) => r.status === 'NOSHOW').length;

  // 예약 상태 변경 처리
  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert(`상태 변경 중 오류: ${error.message}`);
    } else {
      fetchReservations();
    }
  };

  // 신규 수동 예약 추가 처리
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { error } = await supabase.from('reservations').insert([
      {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        reservation_date: selectedDate,
        reservation_time: formData.reservation_time,
        party_size: formData.party_size,
        memo: formData.memo,
        status: 'CONFIRMED',
      },
    ]);

    if (error) {
      alert(`예약 등록 실패: ${error.message}`);
    } else {
      setShowForm(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        reservation_time: '18:00',
        party_size: 2,
        memo: '',
      });
      fetchReservations();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* 상단 헤더 및 기능 버튼 */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827' }}>점주 전용 예약 관리 대시보드</h1>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
            원하는 날짜를 선택하여 현황을 확인하고, 전화 예약을 수동으로 등록하세요.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>날짜 선택:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            />
            <button
              onClick={fetchReservations}
              style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}
            >
              새로고침
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ padding: '8px 16px', backgroundColor: showForm ? '#dc2626' : '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              {showForm ? '닫기 ✕' : '+ 전화 예약 수동 추가'}
            </button>
          </div>
        </div>

        {/* 통계 요약 박스 (4가지 정보) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}>총 예약 건수</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{totalCount}건</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}>예약 인원 총합</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{totalPartySize}명</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}>방문 완료</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{completedCount}건</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '4px' }}>노쇼 발생</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{noshowCount}건</div>
          </div>
        </div>

        {/* 에러 메시지 표시 */}
        {errorMessage && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
            {errorMessage}
          </div>
        )}

        {/* 전화 예약 수동 입력 폼 */}
        {showForm && (
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '2px solid #2563eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2563eb', fontSize: '18px' }}>신규 전화 예약 추가 ({selectedDate})</h3>
            <form onSubmit={handleCreateReservation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>고객 성함</label>
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>연락처</label>
                  <input
                    type="text"
                    required
                    placeholder="010-0000-0000"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>방문 시간</label>
                  <input
                    type="time"
                    required
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>인원수</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.party_size}
                    onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>메모 / 요청사항</label>
                <input
                  type="text"
                  placeholder="예: 창가 자리 희망, 아기 의자 1개 필요"
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
              >
                예약 저장하기
              </button>
            </form>
          </div>
        )}

        {/* 예약 카드 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>데이터를 불러오는 중...</div>
        ) : reservations.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', padding: '48px', textAlign: 'center', borderRadius: '12px', color: '#6b7280', border: '1px solid #e5e7eb' }}>
            선택한 날짜({selectedDate})에 등록된 예약이 없습니다.<br />
            상단의 <b>'+ 전화 예약 수동 추가'</b> 버튼을 눌러 새 예약을 추가해 보세요!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
            {reservations.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                    {item.reservation_time ? item.reservation_time.slice(0, 5) : ''}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: item.status === 'CONFIRMED' ? '#eff6ff' : item.status === 'COMPLETED' ? '#f0fdf4' : item.status === 'NOSHOW' ? '#fef2f2' : '#f3f4f6',
                    color: item.status === 'CONFIRMED' ? '#1d4ed8' : item.status === 'COMPLETED' ? '#15803d' : item.status === 'NOSHOW' ? '#b91c1c' : '#4b5563',
                  }}>
                    {item.status === 'CONFIRMED' && '예약 확정'}
                    {item.status === 'COMPLETED' && '방문 완료'}
                    {item.status === 'NOSHOW' && '노쇼'}
                    {item.status === 'CANCELLED' && '취소됨'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <div><b>성함:</b> {item.customer_name}님</div>
                  <div><b>연락처:</b> {item.customer_phone}</div>
                  <div><b>인원:</b> {item.party_size}명</div>
                  {item.memo && (
                    <div style={{ fontSize: '12px', color: '#4b5563', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                      <b>메모:</b> {item.memo}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                    style={{ flex: 1, padding: '6px 0', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    방문완료
                  </button>
                  <button
                    onClick={() => handleStatusChange(item.id, 'NOSHOW')}
                    style={{ flex: 1, padding: '6px 0', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    노쇼
                  </button>
                  <button
                    onClick={() => handleStatusChange(item.id, 'CANCELLED')}
                    style={{ padding: '6px 10px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    취소
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}