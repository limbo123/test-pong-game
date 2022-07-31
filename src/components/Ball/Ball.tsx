import { FC, useEffect, useRef, useState } from "react";
import styles from "./Ball.module.css";

interface BallProps {
  isGuest: boolean;
  socket: any,
  roomId: string,
  isResetting: boolean,
  cancelIsResetting: () => void;
}

let speedX = -3;
let speedY = 2;
let activePlatform = 1;
let canRestart = true;

const Ball: FC<BallProps> = ({ isGuest, socket, roomId, isResetting, cancelIsResetting }) => {
  const [positionX, setPositionX] = useState(500);
  const [positionY, setPositionY] = useState(100);
  const ball = useRef<any>();
  let startPos = 500;



  useEffect(() => {
    speedX = -3;
    speedY = 2;
    activePlatform = 1;
    let interval: any;
    const gameArea = document.getElementById("game-area");
    const myPlatform = document.getElementById("my-platform");
    const guestPlatform = document.getElementById("guest-platform");

    if (gameArea) {
        interval = setInterval(() => {
          if (myPlatform && guestPlatform) {
            moveBall(
              gameArea?.clientWidth,
              gameArea?.clientHeight,
              +myPlatform?.style.top.replace("px", ""),
              +guestPlatform?.style.top.replace("px", "")
            );
          }
        }, 1000/60);
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  const moveBall = (
    areaWidth: number,
    areaHeight: number,
    myPlatformTop: any,
    guestPlatformTop: any
  ) => {
    const ballLeft = ball.current.style.left.replace("px", "");
    const ballTop = ball.current.style.top.replace("px", "");
    const platformOrder = [myPlatformTop];
    if (isGuest) platformOrder.unshift(guestPlatformTop);
    else platformOrder.push(guestPlatformTop);
    
    if (
      ballLeft <= 14 &&
      platformOrder[0] + 100 > ballTop &&
      platformOrder[0] - 20 < ballTop && activePlatform === 1
    ) {
      activePlatform = 0
      speedX = -speedX * 1.05;
      speedY = speedY * 1.05;
    }
    if (
      ballLeft >= areaWidth - 34 &&
      platformOrder[1] + 100 > ballTop &&
      platformOrder[1] - 20 < ballTop && activePlatform === 0
    ) {
      activePlatform = 1;
      speedX = -speedX * 1.05;
      speedY = speedY * 1.05;
    }
    if (ballLeft <= 0 || ballLeft >= areaWidth - 20) {
      if(!canRestart) return;
      canRestart = false;
      activePlatform = 1;
      if(!isGuest) {
        const resetMessage = {
          type: "ballReset",
          scoredPlayer: ballLeft <= 0 ? 1 : 0,
          platformLocation: null,
          roomId
        }
        socket.send(JSON.stringify(resetMessage));
      }
    }
    if (ballTop >= areaHeight - 20 || ballTop <= 0) {
      speedY = -speedY;
    }
    update();
  };

  useEffect(() => {
    if(isResetting) {
      canRestart = true;
      speedX = -3;
      speedY = 2;
      setPositionX(startPos);
      setPositionY(100);
      cancelIsResetting();
    }
  }, [isResetting]);

  const update = () => {
    setPositionX((prev) => prev + speedX);
    setPositionY((prev) => prev + speedY);
  };

  return (
    <div
      id="ball"
      ref={ball}
      style={{ left: positionX, top: positionY }}
      className={styles.ball}
    ></div>
  );
};

export default Ball;
