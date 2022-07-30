import classNames from "classnames";
import { FC } from "react";
import Ball from "../Ball/Ball";
import styles from "./GameArea.module.css";

interface IGameProps {
  isGuest: boolean;
  room: string;
  socket: WebSocket;
  isResetting: boolean,
  cancelIsResetting: () => void;
  score: number[]
}

export const GameArea: FC<IGameProps> = ({ room, socket, isGuest, isResetting, cancelIsResetting, score }) => {
  const moveMouse = (e: any) => {
    const myPlatform: HTMLDivElement | null = document.getElementById(
      "my-platform"
    ) as HTMLDivElement;
    if (e.pageY > 170 && e.pageY < 570) {
      myPlatform.style.top = e.pageY - 170 + "px";
      const moveMessage = {
        type: "platformMove",
        platformLocation: e.pageY,
        roomId: room,
      };
      socket.send(JSON.stringify(moveMessage));
    }
  };
  return (
    <div
      id="area"
      onMouseMove={(e) => moveMouse(e)}
      className={styles.mouseArea}
    >
      <div className={styles.gameArea} id={"game-area"}>
        <h1>{score[0]}:{score[1]}</h1>
        <div
          className={styles.platform}
          id={isGuest ? "guest-platform" : "my-platform"}
        ></div>
        <div
          className={classNames(styles.platform, styles.guestPlatform)}
          id={isGuest ? "my-platform" : "guest-platform"}
        ></div>
        <Ball isGuest={isGuest} isResetting={isResetting} cancelIsResetting={cancelIsResetting} socket={socket} roomId={room}/>
      </div>
    </div>
  );
};
