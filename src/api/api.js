const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    console.warn("VITE_API_URL이 설정되지 않았습니다.");
}


// ======================================================
// 공통 API 요청 함수
// ======================================================

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `API 요청 실패: ${response.status} ${response.statusText}${
                text ? ` - ${text}` : ""
            }`
        );
    }

    // 응답 데이터가 없는 경우
    if (response.status === 204) {
        return null;
    }

    const text = await response.text();

    // 빈 응답
    if (!text) {
        return null;
    }

    return JSON.parse(text);
}


// ======================================================
// 좌석
// ======================================================

/**
 * 현재 좌석 배치 조회
 *
 * POST /api/seats
 *
 * 반환:
 * [
 *   ["강건우", "강우진", "", "", ""],
 *   ["김건우", "", "", "", ""],
 *   ...
 * ]
 */
export async function getSeats() {
    return request("/seats", {
        method: "POST"
    });
}


/**
 * 좌석 배치 저장
 *
 * POST /api/updateSeat
 *
 * Spring Boot:
 *
 * @RequestBody Map<String, String[][]> req
 *
 * 따라서 다음 형태로 전송한다.
 *
 * {
 *   "seats": [
 *      [...],
 *      [...],
 *      [...],
 *      [...],
 *      [...]
 *   ]
 * }
 */
export async function updateSeats(seats) {

    // 5행 확인
    if (!Array.isArray(seats) || seats.length !== 5) {
        throw new Error("좌석 배열은 5x5여야 합니다.");
    }

    // 각 행 5칸 확인
    for (const row of seats) {
        if (!Array.isArray(row) || row.length !== 5) {
            throw new Error("좌석 배열은 5x5여야 합니다.");
        }
    }

    return request("/updateSeat", {
        method: "POST",
        body: JSON.stringify({
            seats: seats
        })
    });
}


// ======================================================
// 학생
// ======================================================

/**
 * 전체 학생 조회
 *
 * POST /api/list
 */
export async function getStudents() {
    return request("/list", {
        method: "POST",
        body: JSON.stringify({})
    });
}


/**
 * 특정 학생 조회
 *
 * GET /api/student?id=1
 */
export async function getStudent(id) {
    if (id === undefined || id === null) {
        throw new Error("학생 ID가 필요합니다.");
    }

    return request(`/student?id=${encodeURIComponent(id)}`, {
        method: "GET"
    });
}


// ======================================================
// 선택과목
// ======================================================

/**
 * 특정 학생의 선택과목 조회
 *
 * POST /api/subject
 *
 * Body:
 * {
 *   "id": 1
 * }
 */
export async function getSubjects(id) {
    if (id === undefined || id === null) {
        throw new Error("학생 ID가 필요합니다.");
    }

    return request("/subject", {
        method: "POST",
        body: JSON.stringify({
            id: id
        })
    });
}


// ======================================================
// 시간표
// ======================================================

/**
 * 특정 학생의 시간표 조회
 *
 * POST /api/timetable
 *
 * Body:
 * {
 *   "id": 1
 * }
 */
export async function getTimetable(id) {
    if (id === undefined || id === null) {
        throw new Error("학생 ID가 필요합니다.");
    }

    return request("/timetable", {
        method: "POST",
        body: JSON.stringify({
            id: id
        })
    });
}