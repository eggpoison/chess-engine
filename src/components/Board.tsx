import { useCallback, useEffect, useRef, useState } from "react";
import "../css/board.css";
import SETTINGS from "../settings";

type BoardPiece = ["king", 0 | 1] | ["queen", 0 | 1] | ["rook", 0 | 1] | ["knight", 0 | 1] | ["bishop", 0 | 1] | ["pawn", 0 | 1];

type BoardPosition = Array<BoardPiece | null>;

const getDefaultBoardPosition = (): BoardPosition => {
   return [
      ["rook", 0], ["knight", 0], ["bishop", 0], ["queen", 0], ["king", 0], ["bishop", 0], ["knight", 0], ["rook", 0],
      ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0], ["pawn", 0],
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1], ["pawn", 1],
      ["rook", 1], ["knight", 1], ["bishop", 1], ["queen", 1], ["king", 1], ["bishop", 1], ["knight", 1], ["rook", 1]
   ];
}

const getIconOffset = (piece: BoardPiece): [number, number] => {
   const pieceNames = ["queen", "king", "rook", "knight", "bishop", "pawn"];

   const x = pieceNames.indexOf(piece[0]);
   const y = piece[1];

   return [x, y];
}

let getBoardPosition: () => BoardPosition;

const boardSquares = new Array<HTMLElement>(64);

const DIRECTION_OFFSETS: { [key: number]: number } = {
   0: -8,
   1: 1,
   2: 8,
   3: -1,
   4: -7,
   5: 9,
   6: 7,
   7: -9
};

const numSquaresToEdge = new Array<Array<number>>(64);

const precomputeMoveData = (): void => {
   for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
         const numNorth = i;
         const numEast = 7 - j;
         const numSouth = 7 - i;
         const numWest = j;

         const squareIndex = i * 8 + j;

         numSquaresToEdge[squareIndex] = [
            numNorth,
            numEast,
            numSouth,
            numWest,
            Math.min(numNorth, numEast),
            Math.min(numEast, numSouth),
            Math.min(numSouth, numWest),
            Math.min(numWest, numNorth)
         ];
      }
   }
}

export function setup(): void {
   precomputeMoveData();
}

const generateLegalSlidingMoves = (piece: BoardPiece, startSquare: number): Array<number> => {
   const position = getBoardPosition();

   const startDirectionIndex = piece[0] === "bishop" ? 4 : 0;
   const endDirectionIndex = piece[0] === "rook" ? 4 : 8;

   const legalMoves = new Array<number>();

   for (let direction = startDirectionIndex; direction < endDirectionIndex; direction++) {
      for (let i = 0; i < numSquaresToEdge[startSquare][direction]; i++) {
         const targetSquare = startSquare + DIRECTION_OFFSETS[direction] * (i + 1);

         const targetPiece = position[targetSquare];

         // Move is blocked by a friendly piece, so can't move any further
         if (targetPiece !== null && targetPiece[1] === piece[1]) {
            break;
         }

         legalMoves.push(targetSquare);

         // Captures enemy piece so can't move any further
         if (targetPiece !== null && targetPiece[1] !== piece[1]) {
            break;
         }
      }
   }

   return legalMoves;
}

const generateLegalMiscMoves = (piece: BoardPiece, startSquare: number): Array<number> => {
   const position = getBoardPosition();

   const legalMoves = new Array<number>();

   switch (piece[0]) {
      case "king": {
         const squaresToEdge = numSquaresToEdge[startSquare];

         for (let i = 0; i < 8; i++) {
            if (squaresToEdge[i] === 0) continue;

            const offset = DIRECTION_OFFSETS[i];

            const targetSquare = startSquare + offset;
            const targetPiece = position[targetSquare];

            if (!(targetPiece !== null && targetPiece[1] === piece[1])) {
               legalMoves.push(targetSquare);
            }
         }

         break;
      }
      case "knight": {
         // maaagic

         const squaresToEdge = numSquaresToEdge[startSquare];

         for (let i = 0; i < 8; i++) {
            const half = Math.floor(i / 2);

            const cornerOffset = DIRECTION_OFFSETS[4 + half];

            const offsetIdx = (half + i % 2) % 4;
            const offset = DIRECTION_OFFSETS[offsetIdx];
            
            const mainSquaresToEdge = squaresToEdge[offsetIdx];
            const minorSquaresToEdge = squaresToEdge[(half + 1 - i % 2) % 4];
            
            if (mainSquaresToEdge < 2 || minorSquaresToEdge === 0) continue;

            const targetSquare = startSquare + cornerOffset + offset;
            const targetPiece = position[targetSquare];
            if (!(targetPiece !== null && targetPiece[1] === piece[1])) {
               legalMoves.push(targetSquare);
            }
         }

         break;
      }
      case "pawn": {
         const direction = piece[1] === 1 ? -1 : 1;

         // Forwards move
         const targetSquare = startSquare + 8 * direction;
         if (position[targetSquare] === null) {
            legalMoves.push(targetSquare);
         }

         // Double move
         if (Math.floor(startSquare / 8) === (piece[1] === 1 ? 6 : 1)) {
            const targetSquare = startSquare + (piece[1] === 1 ? -16 : 16);
            legalMoves.push(targetSquare);
         }

         // Capture moves
         for (let i = 0; i < 2; i++) {
            const xOffset = i === 0 ? -1 : 1;

            // Stop from wrapping around
            if ((xOffset === -1 && startSquare % 8 === 0) || (xOffset === 1 && startSquare % 8 === 7)) continue;

            const targetSquare = startSquare + 8 * direction + xOffset;
            const targetPiece = position[targetSquare];

            if (targetPiece !== null && targetPiece[1] !== piece[1]) {
               legalMoves.push(targetSquare);
            }
         }

         break;
      }
   }

   return legalMoves;
}

const generateLegalPieceMoves = (piece: BoardPiece, startSquare: number): Array<number> => {
   const slidingPieces = ["rook", "bishop", "queen"];

   if (slidingPieces.includes(piece[0])) {
      return generateLegalSlidingMoves(piece, startSquare);
   } else {
      return generateLegalMiscMoves(piece, startSquare);
   }
}

interface PieceProps {
   piece: BoardPiece;
   movePiece: (startSquare: number, targetSquare: number) => void;
   startSquare: number;
}
const Piece = ({ piece, movePiece: move, startSquare }: PieceProps) => {
   const elemRef = useRef<HTMLDivElement>(null);
   const legalMoves = useRef<Array<number> | null>(null);

   const [xOffset, yOffset] = getIconOffset(piece);
   const style: React.CSSProperties = {
      backgroundPositionX: `-${xOffset * SETTINGS.iconSize}px`,
      backgroundPositionY: `${yOffset * SETTINGS.iconSize}px`
   }

   const startMove = (): void => {
      // Generate legal moves
      legalMoves.current = generateLegalPieceMoves(piece, startSquare);

      // Colour squares with legal moves red
      for (const legalMove of legalMoves.current) {
         const square = boardSquares[legalMove];

         square.classList.add("legal-move");
      }

      const elem = elemRef.current!;
      elem.classList.add("dragging");
   }

   const mouseUp = useCallback((): void => {
      const startX = startSquare % 8;
      const startY = Math.floor(startSquare / 8);

      const uncolourLegalMoves = (): void => {
         // Uncolour the squares with legal moves
         for (const legalMove of legalMoves.current!) {
            const square = boardSquares[legalMove];

            square.classList.remove("legal-move");
         }
      }

      const cancelMove = (): void => {
         document.removeEventListener("mouseup", mouseUp);
         document.removeEventListener("mousemove", mouseMove);
   
         // Reset piece position
         const elem = elemRef.current!;
         elem.style.left = startX * SETTINGS.squareSize + "px";
         elem.style.top = startY * SETTINGS.squareSize + "px";

         elem.classList.remove("dragging");

         uncolourLegalMoves();
      };

      const event = window.event as MouseEvent;

      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const boardBounds = document.getElementById("board")!.getBoundingClientRect();

      const x = mouseX - boardBounds.x;
      const y = mouseY - boardBounds.y;

      const cellX = Math.floor(x / SETTINGS.squareSize);
      const cellY = Math.floor(y / SETTINGS.squareSize);

      const targetSquare = cellY * 8 + cellX;

      if (startSquare === targetSquare || !legalMoves.current!.includes(targetSquare)) {
         cancelMove();
         return;
      }

      if (cellX >= 0 && cellX < 8 && cellY >= 0 && cellY < 8) {
         // Move the piece
         move(startSquare, targetSquare);

         document.removeEventListener("mouseup", mouseUp);
         document.removeEventListener("mousemove", mouseMove);

         uncolourLegalMoves();
      } else {
         cancelMove();
      }
   }, [move, startSquare]);

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

      startMove();
   }

   useEffect(() => {
      return () => {
         document.removeEventListener("mousemove", mouseMove);
         document.removeEventListener("mouseup", mouseUp);
      }
   }, [mouseUp]);

   return <div ref={elemRef} onMouseDown={mouseDown} style={style} className="icon"></div>;
}

interface SquareProps {
   squareIndex: number;
   piece: BoardPiece | null;
   movePiece: (startSquare: number, targetSquare: number) => void;
}
const Square = ({ squareIndex, piece, movePiece }: SquareProps) => {
   const squareRef = useRef<HTMLDivElement | null>(null);
   const [icon, setIcon] = useState<JSX.Element | null>(null);

   useEffect(() => {
      boardSquares[squareIndex] = squareRef.current!;
   }, [squareIndex]);

   useEffect(() => {
      if (piece !== null) {
         setIcon(
            <Piece piece={piece} movePiece={movePiece} startSquare={squareIndex} />
         );
      }

      return () => {
         setIcon(null);
      }
   }, [piece, movePiece, squareIndex]);

   let className = "square";
   if ((squareIndex + Math.floor(squareIndex / 8)) % 2 === 0) {
      className += " square-1";
   } else {
      className += " square-2";
   }
   return <div ref={squareRef} className={className}>
      {icon}
   </div>;
}

const Board = () => {
   const [position, setPosition] = useState<BoardPosition>(getDefaultBoardPosition());
   const player = useRef<0 | 1>(1);

   useEffect(() => {
      getBoardPosition = (): BoardPosition => {
         return position.slice();
      }
   }, [position]);

   const movePiece = useCallback((startSquare: number, targetSquare: number): void => {
      // Switch current player
      const newPlayer = (player.current + 1) % 2 as 0 | 1;
      player.current = newPlayer;

      // Get the piece which is moving
      const piece = position[startSquare];

      // Make the new position
      const newPosition = position.slice();
      newPosition[startSquare] = null;
      newPosition[targetSquare] = piece;
      setPosition(newPosition);
   }, [position]);

   const content = new Array<JSX.Element>();
   for (let i = 0; i < 8; i++) {
      const rowCells = new Array<JSX.Element>();
      for (let j = 0; j < 8; j++) {
         const squareIndex = i * 8 + j;

         const piece = position[squareIndex];
         
         const square = <Square squareIndex={squareIndex} piece={piece} movePiece={movePiece} key={j} />;
         rowCells.push(square);
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