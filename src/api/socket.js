import { Client } from "@stomp/stompjs";

const WS_URL = import.meta.env.VITE_WS_URL;

let client = null;

export function connectSeatSocket(onUpdate) {

    client = new Client({
        brokerURL: WS_URL,

        reconnectDelay: 5000,

        onConnect: () => {

            console.log("좌석 WebSocket 연결 성공");

            client.subscribe("/topic/seats", (message) => {

                try {

                    const seats = JSON.parse(message.body);

                    console.log(
                        "좌석 변경 수신:",
                        seats
                    );

                    onUpdate(seats);

                } catch (error) {

                    console.error(
                        "좌석 데이터 처리 실패:",
                        error
                    );
                }
            });
        },

        onDisconnect: () => {
            console.log("좌석 WebSocket 연결 종료");
        },

        onWebSocketError: (error) => {
            console.error(
                "WebSocket 오류:",
                error
            );
        },

        onStompError: (frame) => {
            console.error(
                "STOMP 오류:",
                frame
            );
        }
    });

    client.activate();
}

export function disconnectSeatSocket() {

    if (client) {
        client.deactivate();
        client = null;
    }
}