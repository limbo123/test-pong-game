# JS Real-time Pong game
**Important Note. It isn't a serious game so there are some out of sync bugs due to the use of websockets. I created this game only for practising purposes.**

This game is implementation of "Pong game" on JS, but you can play this with your friends. There is simple express server which is sending static files to browser, and WebSocket server, where is being all real-time logic. Client side is written with React.    
## How to play
Click the "create room" button and then send the room code to your friend. He must to type thes code in the input in starting page. After this, if all correct, you will see the "player has joined room" message in right-top corner. Then for game start, both of you have to click green "Ready" button. To stop the game click "Leave" button.
