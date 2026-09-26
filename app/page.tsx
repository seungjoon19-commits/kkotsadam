{/* 예약 목록 (노트식 한 줄 레이아웃) */}
<div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
  {/* 상단 헤더 (순서: 시간 / 인원 / 성함 / 연락처 / 담당자 / 예약받은날짜 / 요청사항 / 상태 / 관리) */}
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: '70px 60px 90px 130px 90px 110px 1fr 100px 70px', 
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

  {/* 예약 건별 줄 (노트 스타일) */}
  {filteredReservations.length === 0 ? (
    <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
      해당 조건의 예약 내역이 없습니다.
    </div>
  ) : (
    filteredReservations.map((item) => (
      <div 
        key={item.id} 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '70px 60px 90px 130px 90px 110px 1fr 100px 70px', 
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
        <div>{item.guest_count}명</div>

        {/* 3. 성함 */}
        <div style={{ fontWeight: '600' }}>{item.customer_name}</div>

        {/* 4. 연락처 */}
        <div style={{ color: '#4b5563', fontSize: '13px' }}>{item.customer_phone || '-'}</div>

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

        {/* 상태 선택 드롭다운 */}
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
                item.status === 'pending' ? '#fef9c3' :
                item.status === 'cancelled' ? '#fee2e2' : '#f3f4f6',
              color: 
                item.status === 'confirmed' ? '#166534' :
                item.status === 'pending' ? '#854d0e' :
                item.status === 'cancelled' ? '#991b1b' : '#374151',
              cursor: 'pointer'
            }}
          >
            <option value="pending">대기</option>
            <option value="confirmed">확정</option>
            <option value="completed">방문완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        {/* 삭제 버튼 */}
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