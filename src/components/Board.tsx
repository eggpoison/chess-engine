import { useCallback, useEffect, useRef, useState } from "react";
import "../css/board.css";
import SETTINGS from "../settings";

type BoardPiece = ["king", 0 | 1] | ["queen", 0 | 1] | ["rook", 0 | 1] | ["knight", 0 | 1] | ["bishop", 0 | 1] | ["pawn", 0 | 1];

type BoardPosition = Array<Array<BoardPiece | null>>;

const getDefaultBoardPosition = (): BoardPosition => {
   return [
      [["rook", 0], ["knight", 0], ["bishop", 0], ["queen", 0], ["king", 0], ["bishop", 0], ["knight", 0], ["rook", 0]],
      [["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0]],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1]],
      [["rook", 1], ["knight", 1], ["bishop", 1], ["queen", 1], ["king", 1], ["bishop", 1], ["knight", 1], ["rook", 1]]
   ];
}

const getIconOffset = (piece: BoardPiece): [number, number] => {
   let x!: number;
   switch (piece[0]) {
      case "queen": {
         x = 0;
         break;
      }
      case "king": {
         x = 1;
         break;
      }
      case "rook": {
         x = 2;
         break;
      }
      case "knight": {
         x = 3;
         break;
      }
      case "bishop": {
         x = 4;
         break;
      }
      case "pawn": {
         x = 5;
         break;
      }
   }

   return [x, piece[1]];
}

let getBoardPosition: () => BoardPosition;

/**
 * Makes sure that a move is valid depending on the rules of the specific piece type.
 * @param piece The piece.
 * @param startX The x coordinate of where the piece started at.
 * @param startY The y coordinate of where the piece started at.
 * @param x The x coordinate of where the piece wants to move.
 * @param y The y coordinate of where the piece wants to move.
 * @returns Whether the move is valid or not.
 */
const validateMove = (piece: BoardPiece, startX: number, startY: number, x: number, y: number): boolean => {
   const position = getBoardPosition();

   if (position[y][x] !== null && position[y][x]![1] === piece[1]) return false;
   
   const xDist = Math.abs(startX - x);
   const yDist = Math.abs(startY - y);

   console.log(startX, startY);
   switch (piece[0]) {
      case "queen": {

         // If the piece tried to move not on any axis or diagonals
         if (xDist !== 0 && yDist !== 0 && xDist !== yDist) return false;

         // If the piece tried to jump over any others

         if (startY - y > 0) {
            if (startX - x > 0) {
               // Top left
               for (let i = 0; i < xDist - 1; i++) {
                  const x = startX - i - 1;
                  const y = startY - i - 1;

                  const piece = position[y][x];
                  if (piece !== null) return false;
               }
            } else if (startX - x < 0) {
               // Top right
               for (let i = 0; i < xDist - 1; i++) {
                  const x = startX + i - 1;
                  const y = startY - i - 1;

                  const piece = position[y][x];
                  if (piece !== null) return false;
               }
            } else {
               // Top middle
               for (let i = 0; i < yDist - 1; i++) {
                  const x = startX;
                  const y = startY - i - 1;

                  const piece = position[y][x];
                  if (piece !== null) return false;
               }
            }
         } else if (startY - y < 0) {
            if (startX - x > 0) {
               // Bottom left
               for (let i = 0; i < xDist - 1; i++) {
                  const x = startX - i - 1;
                  const y = startY + i - 1;

                  const piece = position[y][x];
                  if (piece !== null) return false;
               }
            } else if (startX - x < 0) {
               // Bottom right
               for (let i = 0; i < xDist - 1; i++) {
                  const x = startX + i - 1;
                  const y = startY + i - 1;

                  const piece = position[y][x];
                  if (piece !== null) return false;
               }
            } else {
               // Bottom middle
               for (let i = 0; i < yDist - 1; i++) {
                  const x = startX - 1;
                  const y = startY + i - 1;

                  const piece = position[y][x];
                  if (piece !== null) return false;
               }
            }
         } else {
            if (startX - x < 0) {
               // Left middle
               for (let i = 0; i < yDist - 1; i++) {
                  const x = startX - i - 1;
                  const y = startY;

                  const piece = position[y][x];
                  if (piece !== null) return false;
               }
            }
         }

         break;
      }
      case "king": {
         if (xDist > 1 || yDist > 1) return false;

         break;
      }
      case "rook": {
         if (xDist > 0 && yDist > 0) return false;

         break;
      }
   }
   return true;
}

interface PieceIconProps {
   piece: BoardPiece;
   move: (startX: number, startY: number, x: number, y: number) => void;
   startX: number;
   startY: number;
}
const PieceIcon = ({ piece, move, startX, startY }: PieceIconProps) => {
   const elemRef = useRef<HTMLDivElement>(null);

   const [xOffset, yOffset] = getIconOffset(piece);
   const style: React.CSSProperties = {
      backgroundPositionX: `-${xOffset * SETTINGS.iconSize}px`,
      backgroundPositionY: `${yOffset * SETTINGS.iconSize}px`
   }

   const mouseUp = useCallback((): void => {
      const cancelMove = (): void => {
         document.removeEventListener("mouseup", mouseUp);
         document.removeEventListener("mousemove", mouseMove);
   
         // Reset piece position
         const elem = elemRef.current!;
         elem.style.left = startX * SETTINGS.cellSize + "px";
         elem.style.top = startY * SETTINGS.cellSize + "px";
      };

      const event = window.event as MouseEvent;

      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const boardBounds = document.getElementById("board")!.getBoundingClientRect();

      const x = mouseX - boardBounds.x;
      const y = mouseY - boardBounds.y;

      const cellX = Math.floor(x / SETTINGS.cellSize);
      const cellY = Math.floor(y / SETTINGS.cellSize);

      if (cellX === startX && cellY === startY) {
         cancelMove();
         return;
      }
      if (cellX >= 0 && cellX < 8 && cellY >= 0 && cellY < 8) {
         const moveIsValid = validateMove(piece, startX, startY, cellX, cellY);

         if (moveIsValid) {
            // Move the piece
            move(startX, startY, cellX, cellY);
         } else {
            cancelMove();
         }
      } else {
         cancelMove();
      }
   }, [move, piece, startX, startY]);

   const mouseMove = (): void => {
      const event = window.event as MouseEvent;

      const x = event.clientX;
      const y = event.clientY;

      const boardBounds = document.getElementById("board")!.getBoundingClientRect();
      const pieceBounds = elemRef.current!.getBoundingClientRect();

      const elem = elemRef.current!;
      elem.style.left = x - boardBounds.x - pieceBounds.width/2 + "px";
      elem.style.top = y - boardBounds.y - pieceBounds.height/2 + "px";
   }

   const mouseDown = (): void => {
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
   }

   useEffect(() => {
      return () => {
         document.removeEventListener("mousemove", mouseMove);
         document.removeEventListener("mouseup", mouseUp);
      }
   }, [mouseUp]);

   return <div ref={elemRef} onMouseDown={mouseDown} style={style} className="icon"></div>;
}

const Board = () => {
   const [position, setPosition] = useState<BoardPosition>(getDefaultBoardPosition());
   const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(1);

   useEffect(() => {
      getBoardPosition = (): BoardPosition => {
         return position.slice();
      }
   }, [position]);

   const movePiece = (startX: number, startY: number, x: number, y: number): void => {
      // Get the piece which is moving
      const piece = position[startY][startX];

      // Make the new position
      const newPosition = position.slice();
      newPosition[startY][startX] = null;
      newPosition[y][x] = piece;
      setPosition(newPosition);

      // Switch player to move
      const newPlayer = (currentPlayer + 1) % 2 as 0 | 1;
      setCurrentPlayer(newPlayer);
   }

   const content = new Array<JSX.Element>();
   for (let i = 0; i < 8; i++) {
      const rowCells = new Array<JSX.Element>();
      for (let j = 0; j < 8; j++) {
         const piece = position[i][j];

         let icon = undefined;
         if (piece !== null) {
            icon = <PieceIcon piece={piece} move={movePiece} startX={j} startY={i} />;
         }

         const style: React.CSSProperties = {
            backgroundColor: (i + j) % 2 ? SETTINGS.cell2Colour : SETTINGS.cell1Colour
         };
         const cell = <div style={style} className="cell" key={j}>
            {icon}
         </div>;
         rowCells.push(cell);
      }

      const row = <div className="row" key={i}>
         {rowCells}
      </div>;
      content.push(row);
   }

   return (
      <div id="board">
         {content}
      </div>
   );
}

export default Board;