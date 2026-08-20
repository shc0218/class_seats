<template>
  <div class="mobile-app-container">

    <header class="app-header">
      <h1>좌석 배치</h1>

      <div class="status-bar">
        <span>
          남은 학생:
          <b>{{ availableNames.length }}</b>명
        </span>

        <span>
          지정 완료:
          <b>{{ fixedGroupNames.length }}</b>명
        </span>
      </div>
    </header>


    <main class="content-wrapper">

      <!-- 학생 명단 -->
      <section class="card selection-card">

        <div class="card-header">
          <div class="card-title">
            <span class="icon">👥</span>
            <span>학생 명단</span>

            <small class="count-badge">
              {{ availableNames.length }}명 남음
            </small>
          </div>
        </div>

        <div class="name-grid-container">

          <div
            v-for="person in availableNames"
            :key="person.original"
            class="student-item"
            :class="{
              'is-selected': selectedName === person.original
            }"
            @click="handleNameSelection(person.original)"
          >

            <div class="student-no">
              {{ person.id }}
            </div>

            <div class="student-name">
              {{ person.shortName }}
            </div>

            <div
              v-if="selectedName === person.original"
              class="check-mark"
            >
              ✓
            </div>

          </div>

        </div>
      </section>


      <!-- 지정 학생 -->
      <section class="card group-card">

        <div
          class="drop-zone-mobile"
          :class="{ 'can-drop': selectedName }"
          @click="handleTargetClick"
        >

          <div
            v-if="fixedGroupNames.length === 0"
            class="empty-hint"
          >
            학생 선택 후
            <b>이곳을 터치</b>
            하여 명단 추가
          </div>

          <div class="tag-cloud">

            <span
              v-for="person in sortedFixedGroup"
              :key="person.original"
              class="mobile-tag"
            >

              {{ person.displayName }}

              <i
                class="close-icon"
                @click.stop="removeFromGroup(person.original)"
              >
                ×
              </i>

            </span>

          </div>

        </div>

      </section>


      <!-- 좌석 -->
      <section class="card seat-card">

        <div class="desk-indicator">
          교 탁
        </div>


        <!-- 저장 상태 -->
        <div
          v-if="loadingSeats"
          class="seat-status"
        >
          좌석 정보를 불러오는 중...
        </div>

        <div
          v-if="savingSeats"
          class="seat-status"
        >
          좌석 저장 중...
        </div>


        <div class="mobile-grid">

          <div
            v-for="i in 25"
            :key="i"
            class="m-seat"
            :class="{
              'm-fixed': fixedGroupSeats.includes(i),
              'm-disabled': isDisabledSeat(i),
              'm-occupied': finalGrid[i - 1]
            }"
            @click="handleSeatClick(i)"
          >

            <span class="m-num">
              {{ i }}
            </span>


            <div
              v-if="isDisabledSeat(i)"
              class="m-icon"
            >
              🚫
            </div>


            <div
              v-else-if="finalGrid[i - 1]"
              class="m-name"
            >
              {{ getShortName(finalGrid[i - 1]) }}
            </div>


            <!-- 스왑 버튼 -->
            <button
              v-if="
                swapMode &&
                !isDisabledSeat(i) &&
                finalGrid[i - 1]
              "
              class="swap-button"
              @click.stop="toggleSwapSeat(i)"
            >
              ⇄
            </button>

          </div>

        </div>


        <p class="grid-hint">
          * 번호 터치: 지정석 설정/해제
        </p>

      </section>


      <!-- 액션 -->
      <div class="action-group">

        <button
          @click="assignSeats"
          class="btn-main-apply pulse"
        >
          🚀 랜덤 배치 시작
        </button>


        <!-- 스왑 -->
        <button
          @click="toggleSwapMode"
          class="btn-swap-mode"
          :class="{ active: swapMode }"
        >

          {{ swapMode ? '🔄 자리 바꾸기 그만두기' : '🔀 자리 바꾸기' }}

        </button>


        <div class="swap-info" v-if="swapMode">

          <span v-if="swapFirstSeat === null">
            첫 번째 좌석을 선택하세요
          </span>

          <span v-else>
            {{ swapFirstSeat }}번 선택됨 →
            두 번째 좌석을 선택하세요
          </span>

        </div>


        <!-- 저장 -->
        <div class="save-button-wrapper">

          <button
            @click="saveImage('teacher')"
            class="btn-save teacher"
          >
            학생용 저장
          </button>

          <button
            @click="saveImage('student')"
            class="btn-save student"
          >
            교사용 저장
          </button>

        </div>


        <button
          @click="resetAll"
          class="btn-reset"
        >
          🔄 전체 초기화
        </button>

      </div>

    </main>


    <!-- 이미지 캡처용 -->
    <div style="display:none">

      <div
        id="capture-area"
        class="capture-box"
      >

        <h2 style="margin-bottom:15px; color:#333;">
          좌석 배치표
        </h2>


        <div
          v-if="captureMode !== 'student'"
          class="desk-indicator"
          style="
            width:240px;
            margin:0 auto 25px;
            padding:10px;
            font-size:1.1rem;
          "
        >
          교 탁
        </div>


        <div
          v-else
          style="height:30px;"
        ></div>


        <div class="cap-grid">

          <div
            v-for="idx in captureIndices"
            :key="idx"
            class="cap-item"
            :class="{
              'cap-disabled': isDisabledSeat(idx)
            }"
          >

            <small>
              {{ idx }}
            </small>


            <div
              v-if="!isDisabledSeat(idx)"
              class="cap-name"
            >
              {{ getDisplayName(finalGrid[idx - 1]) }}
            </div>


            <div v-else>
              🚫
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted,
  nextTick
} from 'vue';

import html2canvas from 'html2canvas';

import {
  getSeats,
  updateSeats
} from './api/api.js';


// =====================================================
// 학생
// =====================================================

const initialNames = [
  "강건우",
  "강우진",
  "곽재영",
  "권민준",
  "김건우",
  "김근호",
  "김도원",
  "김예찬",
  "김현우",
  "민경환",
  "민상호",
  "박성준",
  "박시형",
  "백승진",
  "송준혁",
  "신지민",
  "양준석",
  "이정우",
  "임성현",
  "전주헌",
  "정승환",
  "주영웅",
  "차현준",
  "추정웅"
];


// =====================================================
// 상태
// =====================================================

const fixedGroupNames = ref([]);

const fixedGroupSeats = ref([]);

const finalGrid = ref(
  Array(25).fill(null)
);

const disabledSeats = [25];

const selectedName = ref(null);

const captureMode = ref('teacher');


// =====================================================
// API 상태
// =====================================================

const loadingSeats = ref(false);

const savingSeats = ref(false);


// =====================================================
// 스왑 상태
// =====================================================

const swapMode = ref(false);

const swapFirstSeat = ref(null);


// =====================================================
// 학생 데이터
// =====================================================

const processedNames = computed(() => {

  return initialNames.map((name, i) => ({
    id: i + 1,
    original: name,
    displayName: `${i + 1}. ${name}`,
    shortName: name
  }));

});


const availableNames = computed(() => {

  return processedNames.value.filter(
    p => !fixedGroupNames.value.includes(p.original)
  );

});


const sortedFixedGroup = computed(() => {

  return processedNames.value.filter(
    p => fixedGroupNames.value.includes(p.original)
  );

});


// =====================================================
// 이름
// =====================================================

const getDisplayName = (name) => {

  if (!name) {
    return "";
  }

  return (
    processedNames.value.find(
      p => p.original === name
    )?.displayName || ""
  );

};


const getShortName = (name) => {

  if (!name) {
    return "";
  }

  return (
    processedNames.value.find(
      p => p.original === name
    )?.shortName || ""
  );

};


// =====================================================
// 좌석
// =====================================================

const isDisabledSeat = (num) => {

  return disabledSeats.includes(num);

};


// =====================================================
// 초기 좌석 불러오기
// =====================================================

const fetchSeats = async () => {

  loadingSeats.value = true;

  try {

    const data = await getSeats();

    console.log("서버 좌석 데이터:", data);


    if (
      !Array.isArray(data) ||
      data.length !== 5
    ) {
      throw new Error(
        "서버 좌석 데이터가 올바르지 않습니다."
      );
    }


    const newGrid = Array(25).fill(null);


    for (let row = 0; row < 5; row++) {

      if (
        !Array.isArray(data[row]) ||
        data[row].length !== 5
      ) {
        continue;
      }


      for (let col = 0; col < 5; col++) {

        const name = data[row][col];

        if (
          name !== null &&
          name !== undefined &&
          name !== ""
        ) {

          newGrid[row * 5 + col] = name;

        }

      }

    }


    finalGrid.value = newGrid;

  } catch (error) {

    console.error(
      "좌석 조회 실패:",
      error
    );

  } finally {

    loadingSeats.value = false;

  }

};


// =====================================================
// 좌석 DB 저장
// =====================================================

const saveSeatsToServer = async () => {

  if (savingSeats.value) {
    return;
  }


  savingSeats.value = true;

  try {

    // 서버가 원하는 형식
    //
    // {
    //   "seats": [
    //      ["김건우", ...],
    //      ...
    //   ]
    // }

    const seats = [];

    for (let row = 0; row < 5; row++) {

      const rowData = [];

      for (let col = 0; col < 5; col++) {

        rowData.push(
          finalGrid.value[row * 5 + col] || ""
        );

      }

      seats.push(rowData);

    }


    await updateSeats(seats);

    console.log(
      "좌석 저장 완료"
    );

  } catch (error) {

    console.error(
      "좌석 저장 오류:",
      error
    );

    alert(
      "좌석 저장에 실패했습니다."
    );

  } finally {

    savingSeats.value = false;

  }

};


// =====================================================
// 학생 선택
// =====================================================

const handleNameSelection = (name) => {

  if (swapMode.value) {
    return;
  }

  selectedName.value =
    selectedName.value === name
      ? null
      : name;

};


// =====================================================
// 지정석 그룹 추가
// =====================================================

const handleTargetClick = () => {

  if (!selectedName.value) {
    return;
  }


  if (
    !fixedGroupNames.value.includes(
      selectedName.value
    )
  ) {

    fixedGroupNames.value.push(
      selectedName.value
    );

  }


  selectedName.value = null;

};


// =====================================================
// 지정석 좌석 설정
// =====================================================

const toggleSeatSelection = (num) => {

  if (isDisabledSeat(num)) {
    return;
  }


  if (
    fixedGroupSeats.value.includes(num)
  ) {

    fixedGroupSeats.value =
      fixedGroupSeats.value.filter(
        s => s !== num
      );

  } else {

    fixedGroupSeats.value.push(num);

  }

};


// =====================================================
// 좌석 클릭
// =====================================================

const handleSeatClick = (num) => {

  if (isDisabledSeat(num)) {
    return;
  }


  // 스왑 모드
  if (swapMode.value) {

    toggleSwapSeat(num);

    return;

  }


  // 일반 모드 → 지정석
  toggleSeatSelection(num);

};


// =====================================================
// 지정 학생 제거
// =====================================================

const removeFromGroup = (name) => {

  fixedGroupNames.value =
    fixedGroupNames.value.filter(
      n => n !== name
    );

};


// =====================================================
// 랜덤 배치
// =====================================================

const assignSeats = async () => {

  let result =
    Array(25).fill(null);


  // 지정 학생
  let namesToFix =
    [...fixedGroupNames.value]
      .sort(
        () => Math.random() - 0.5
      );


  // 지정 좌석
  let seatsToFix =
    [...fixedGroupSeats.value]
      .sort(
        () => Math.random() - 0.5
      );


  namesToFix.forEach(
    (name, i) => {

      if (i < seatsToFix.length) {

        result[
          seatsToFix[i] - 1
        ] = name;

      }

    }
  );


  // 나머지 학생
  const pool =
    initialNames
      .filter(
        n => !result.includes(n)
      )
      .sort(
        () => Math.random() - 0.5
      );


  // 빈 좌석
  let empties =
    result
      .map(
        (v, i) =>
          v === null &&
          !isDisabledSeat(i + 1)
            ? i
            : null
      )
      .filter(
        v => v !== null
      )
      .sort(
        () => Math.random() - 0.5
      );


  pool.forEach(
    (name, i) => {

      if (i < empties.length) {

        result[
          empties[i]
        ] = name;

      }

    }
  );


  finalGrid.value = result;


  // DB 저장
  await saveSeatsToServer();

};


// =====================================================
// 스왑 모드
// =====================================================

const toggleSwapMode = () => {

  swapMode.value =
    !swapMode.value;


  swapFirstSeat.value = null;

};


// =====================================================
// 스왑
// =====================================================

const toggleSwapSeat = async (num) => {

  if (
    isDisabledSeat(num) ||
    !swapMode.value
  ) {

    return;

  }


  // 첫 번째 좌석
  if (
    swapFirstSeat.value === null
  ) {

    if (!finalGrid.value[num - 1]) {

      return;

    }


    swapFirstSeat.value = num;

    return;

  }


  // 같은 좌석
  if (
    swapFirstSeat.value === num
  ) {

    swapFirstSeat.value = null;

    return;

  }


  const first =
    swapFirstSeat.value - 1;

  const second =
    num - 1;


  // 자리 교환
  const temp =
    finalGrid.value[first];


  finalGrid.value[first] =
    finalGrid.value[second];


  finalGrid.value[second] =
    temp;


  // 선택 초기화
  swapFirstSeat.value = null;


  // 바로 DB 저장
  await saveSeatsToServer();

};


// =====================================================
// 전체 초기화
// =====================================================

const resetAll = () => {

  fixedGroupNames.value = [];

  fixedGroupSeats.value = [];

  finalGrid.value =
    Array(25).fill(null);

  selectedName.value = null;

  swapMode.value = false;

  swapFirstSeat.value = null;

};


// =====================================================
// 이미지 저장
// =====================================================

const captureIndices = computed(() => {

  const base =
    Array.from(
      { length: 25 },
      (_, i) => i + 1
    );


  return captureMode.value === 'teacher'
    ? base
    : [...base].reverse();

});


const saveImage = async (mode) => {

  captureMode.value = mode;

  await nextTick();


  const element =
    document.getElementById(
      'capture-area'
    );


  const parent =
    element.parentElement;


  parent.style.display = 'block';


  try {

    const canvas =
      await html2canvas(
        element,
        {
          scale: 2,
          backgroundColor: '#ffffff'
        }
      );


    const link =
      document.createElement('a');


    link.download =
      `좌석배치표_${
        mode === 'teacher'
          ? '학생용'
          : '교사용'
      }.png`;


    link.href =
      canvas.toDataURL(
        'image/png'
      );


    link.click();

  } finally {

    parent.style.display = 'none';

  }

};


// =====================================================
// 시작
// =====================================================

onMounted(() => {

  fetchSeats();

});

</script>


<style scoped>

.mobile-app-container {
  max-width: 500px;
  margin: 0 auto;
  background: #f8f9fc;
  min-height: 100vh;
  padding-bottom: 40px;
  font-family: sans-serif;
}

.app-header {
  background: #fff;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.status-bar {
  display: flex;
  justify-content: center;
  gap: 15px;
  font-size: 0.8rem;
  color: #666;
  margin-top: 8px;
}

.content-wrapper {
  padding: 15px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.selection-card {
  border-radius: 20px;
}

.card-header {
  margin-bottom: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
}

.count-badge {
  background: #edf2ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  margin-left: auto;
}

.name-grid-container {
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}

.student-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: #f1f3f5;
  border-radius: 12px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: 0.2s;
}

.student-item.is-selected {
  background: #fff;
  border-color: #4f46e5;
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0,0,0,0.05);
}

.student-no {
  font-size: 0.6rem;
  color: #999;
  margin-bottom: 2px;
}

.student-name {
  font-size: 0.85rem;
  font-weight: 600;
}

.check-mark {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #4f46e5;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone-mobile {
  min-height: 60px;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mobile-tag {
  background: #4f46e5;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
}

.close-icon {
  margin-left: 5px;
  cursor: pointer;
}

.desk-indicator {
  background: #334155;
  color: white;
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  font-weight: bold;
}

.mobile-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.m-seat {
  aspect-ratio: 1 / 1;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: white;
  cursor: pointer;
}

.m-seat.m-fixed {
  border: 2px solid #f59e0b;
  background: #fffbeb;
}

.m-seat.m-disabled {
  background: #f1f5f9;
  border: none;
}

.m-seat.m-occupied {
  background: white;
}

.m-num {
  position: absolute;
  top: 3px;
  left: 4px;
  font-size: 0.6rem;
  color: #94a3b8;
}

.m-name {
  font-size: 0.8rem;
  font-weight: bold;
}

.m-icon {
  font-size: 1rem;
}

.swap-button {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  font-size: 12px;
  cursor: pointer;
  z-index: 2;
}

.action-group {
  padding: 0 5px;
}

.btn-main-apply {
  width: 100%;
  padding: 18px;
  border-radius: 16px;
  border: none;
  background: #4f46e5;
  color: white;
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 1.1rem;
  cursor: pointer;
}

.btn-swap-mode {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 8px;
}

.btn-swap-mode.active {
  background: #4f46e5;
  color: white;
}

.swap-info {
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
  padding: 8px;
  margin-bottom: 8px;
}

.save-button-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.btn-save {
  flex: 1;
  padding: 15px;
  border-radius: 12px;
  border: none;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.btn-save.teacher {
  background: #6366f1;
}

.btn-save.student {
  background: #10b981;
}

.btn-reset {
  width: 100%;
  padding: 12px;
  background: none;
  border: 1px solid #ddd;
  color: #999;
  border-radius: 12px;
  cursor: pointer;
}

.seat-status {
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 10px;
}

.grid-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: center;
}

.capture-box {
  padding: 40px;
  width: 600px;
  background: #fff;
  text-align: center;
}

.cap-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.cap-item {
  border: 1px solid #333;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 8px;
}

.cap-disabled {
  background: #f5f5f5;
  border-color: #ddd;
  color: #ccc;
}

.cap-name {
  font-size: 1.1rem;
  font-weight: bold;
}

@keyframes pulse {

  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }

  100% {
    transform: scale(1);
  }

}

.pulse {
  animation: pulse 2s infinite;
}

</style>