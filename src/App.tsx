import { FC, useRef, useState } from "react";
import { GameArea } from "./components/GameArea/GameArea";
import styles from "./App.module.css";
import classNames from "classnames";
import { v4 as uuidv4 } from "uuid";

const App: FC = () => {
  const [room, setRoom] = useState<string>("");
  const socket: any = useRef();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [score, setScore] = useState<number[]>([0, 0]);
  const [messages, setMessages] = useState<string[]>([]);
  const [isTwoPlayers, setIsTwoPlayers] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const resetOnLeave = () => {
    setIsConnected(false);
    setIsGuest(false);
    setIsReady(false);
    setIsGameStarted(false);
    setIsResetting(false);
    setScore([0, 0]);
    setMessages([]);
    setIsTwoPlayers(false);
  };

  const connect = (connectingType: string) => {
    if (isConnected) return;

    socket.current = new WebSocket("wss://limbo123-websocket-pong-game.herokuapp.com");

    socket.current.onopen = () => {
      console.log("open");
      const joinMessage = {
        type: connectingType,
        roomId: room,
        newLocation: null,
      };
      socket.current.send(JSON.stringify(joinMessage));
      setIsConnected(true);
    };
    socket.current.onmessage = (event: any) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "role":
          setIsGuest(message.isGuest);
          setRoomId(message.roomId);
          break;
        case "enter":
          setIsTwoPlayers(message.isTwoPlayers);
          setMessages((prev) => [message.message, ...prev]);
          console.log(message.rooms);
          break;
        case "leave":
          setIsTwoPlayers(message.isTwoPlayers);
          setIsGameStarted(false);
          setScore([0, 0]);
          setMessages((prev) => [message.message, ...prev]);
          break;
        case "opponentReady":
          setMessages((prev) => [message.message, ...prev]);
          break;
        case "roomFull":
          setError(message.error);
          break;
        case "gameStarting":
          setIsGameStarted(true);
          break;
        case "platformMoved":
          const guestPlatform: HTMLDivElement = document.getElementById(
            "guest-platform"
          ) as HTMLDivElement;
          guestPlatform.style.top = message.platformLocation - 170 + "px";
          break;
        case "newScore":
          setIsResetting(true);
          setScore(message.score);
          break;
        case "deleteRoom":
          resetOnLeave();
          break;
      }
    };
    socket.current.onclose = () => {
      console.log("Socket is closed");
    };
  };

  const getReady = () => {
    const isReadyMessage = {
      type: "getReady",
      roomId: roomId,
      newLocation: null,
    };
    socket.current.send(JSON.stringify(isReadyMessage));
    setIsReady(true);
  };

  const leaveRoom = () => {
    const leaveMessage = {
      roomId: roomId,
      newLocation: null,
      type: "leave",
    };
    socket.current.send(JSON.stringify(leaveMessage));
    resetOnLeave();
  };

  return (
    <>
      {!isConnected ? (
        <div className={styles.startingForm}>
          <h1 className={styles.logo}>PONG GAME</h1>
          <button
            className={classNames(styles.button, styles.purpleBtn)}
            onClick={() => connect("createRoom")}
          >
            create room
          </button>

          <h2 className={styles.orButton}>Or</h2>

          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Enter the room code"
          />
          <button
            className={classNames(styles.button, styles.greenBtn)}
            onClick={() => connect("joinRoom")}
          >
            connect to room
          </button>
        </div>
      ) : (
        <>
          <div className={styles.messagesLog}>
            <h3>Messages Log:</h3>
            {messages.map((msg) => {
              return <div key={uuidv4()}>{msg}</div>;
            })}
          </div>
          {!isGuest && <h1 className={styles.joinCode}>Code to join your room: <span>{roomId}</span></h1>}
          <button
            onClick={leaveRoom}
            className={classNames(styles.button, styles.redBtn)}
          >
            leave
          </button>
          {isTwoPlayers || isGuest ? (
            <>
              {!isReady && (
                <button
                  type="button"
                  className={classNames(styles.button, styles.greenBtn)}
                  onClick={getReady}
                >
                  Ready
                </button>
              )}
            </>
          ) : (
            <p className={styles.waitingTxt}>Waiting for opponent...</p>
          )}
          {isGameStarted && (
            <GameArea
              score={score}
              isGuest={isGuest}
              room={roomId}
              socket={socket.current}
              isResetting={isResetting}
              cancelIsResetting={() => setIsResetting(false)}
            />
          )}
        </>
      )}
    </>
  );
};

export default App;
