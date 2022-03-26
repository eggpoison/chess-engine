import { useCallback, useEffect, useRef, useState } from "react";
import AudioFromFile from "../AudioFromFile";
import Board from "../Board";
import { applyMove, generateComputerMove, generateLegalPieceMoves, PlayerColours } from "../computer-ai";
import "../css/board.css";
import Move, { MoveFlags } from "../Move";
import Piece, { PieceTypes } from "../Piece";
import SETTINGS from "../settings";

const getDefaultBoardPosition = (): Board => {
   let squares = new Array<Piece | null>();

   const getMainRank = (colour: PlayerColours): Array<Piece> => {
      return [
         new Piece(PieceTypes.Rook, colour, squares.length),
         new Piece(PieceTypes.Knight, colour, squares.length + 1),
         new Piece(PieceTypes.Bishop, colour, squares.length + 2),
         new Piece(PieceTypes.Queen, colour, squares.length + 3),
         new Piece(PieceTypes.King, colour, squares.length + 4),
         new Piece(PieceTypes.Bishop, colour, squares.length + 5),
         new Piece(PieceTypes.Knight, colour, squares.length + 6),
         new Piece(PieceTypes.Rook, colour, squares.length + 7)
      ];
   }

   const getPawnRank = (colour: PlayerColours): Array<Piece> => {
      const rank = new Array<Piece>();
      for (let i = 0; i < 8; i++) {
         rank.push(new Piece(PieceTypes.Pawn, colour, squares.length + i));
      }
      return rank;
   }

   // Black pieces
   squares = squares.concat(...getMainRank(PlayerColours.Black));
   squares = squares.concat(...getPawnRank(PlayerColours.Black));

   // Create the 4 empty ranks
   for (let i = 0; i < 32; i++) {
      squares.push(null);
   }

   // White pieces
   squares = squares.concat(...getPawnRank(PlayerColours.White));
   squares = squares.concat(...getMainRank(PlayerColours.White));

   const board = new Board(squares);
   return board;
}

export let gameBoard: Board = getDefaultBoardPosition();

const getIconOffset = (piece: Piece): [number, number] => {
   const x = piece.type;
   const y = piece.colour;

   return [x, y];
}

let currentPlayer = 1;

const boardSquares = new Array<HTMLElement>(64);

interface PieceIconProps {
   piece: Piece;
   movePiece: (move: Move) => void;
}
const PieceIcon = ({ piece, movePiece }: PieceIconProps) => {
   const elemRef = useRef<HTMLDivElement>(null);
   const legalMoves = useRef<Array<Move> | null>(null);

   const [xOffset, yOffset] = getIconOffset(piece);
   const style: React.CSSProperties = {
      backgroundPositionX: `-${xOffset * SETTINGS.iconSize}px`,
      backgroundPositionY: `${yOffset * SETTINGS.iconSize}px`
   }

   const startMove = (): void => {
      // Generate legal moves
      // console.log(gameBoard.squares.slice());
      // console.log(piece);
      legalMoves.current = generateLegalPieceMoves(gameBoard, piece);

      // Colour squares with legal moves red
      for (const legalMove of legalMoves.current) {
         const square = boardSquares[legalMove.targetSquare];

         square.classList.add("legal-move");
      }

      const elem = elemRef.current!;
      elem.classList.add("dragging");
   }

   const mouseUp = useCallback((): void => {
      const startX = piece.square % 8;
      const startY = Math.floor(piece.square / 8);

      const uncolourLegalMoves = (): void => {
         // Uncolour the squares with legal moves
         for (const legalMove of legalMoves.current!) {
            const square = boardSquares[legalMove.targetSquare];

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

      if (piece.square === targetSquare) {
         cancelMove();
         return;
      }

      let moveIsValid = false;
      for (const move of legalMoves.current!) {
         if (move.targetSquare === targetSquare) {
            moveIsValid = true;
            break;
         }
      }
      if (!moveIsValid) {
         cancelMove();
         return;
      }

      if (cellX >= 0 && cellX < 8 && cellY >= 0 && cellY < 8) {
         // Get the move
         let move!: Move;
         for (const currentMove of legalMoves.current!) {
            if (currentMove.targetSquare === targetSquare) {
               move = currentMove;
               break;
            }
         }

         // Move the piece
         movePiece(move);

         document.removeEventListener("mouseup", mouseUp);
         document.removeEventListener("mousemove", mouseMove);

         uncolourLegalMoves();
      } else {
         cancelMove();
      }
   }, [movePiece, piece.square]);

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
      const canMove = currentPlayer === PlayerColours.White;
      if (!canMove) return;

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

   return <div ref={elemRef} onMouseDown={piece.colour === PlayerColours.White ? mouseDown : undefined} style={style} className="icon"></div>;
}

interface SquareProps {
   squareIndex: number;
   piece: Piece | null;
   movePiece: (move: Move) => void;
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
            <PieceIcon piece={piece} movePiece={movePiece} />
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

export const BoardElem = () => {
   const [currentPlayer, setCurrentPlayer] = useState<PlayerColours>(PlayerColours.White);

   const movePiece = useCallback((move: Move): void => {
      move.piece.timesMoved++;

      // Play move sound
      switch (move.flags) {
         case MoveFlags.None: {
            const targetPiece = gameBoard.squares[move.targetSquare];
            if (targetPiece !== null) {
               // If a piece has been captured
               new AudioFromFile("capture.mp3");
            } else {
               new AudioFromFile("move.mp3");
            }

            break;
         }
         case MoveFlags.IsCastling: {
            new AudioFromFile("castling.mp3");

            break;
         }
      }

      // Make the new position
      const newBoard = applyMove(gameBoard, move);
      gameBoard = newBoard;

      // Switch current player
      const newCurrentPlayer = (currentPlayer + 1) % 2 as 0 | 1;
      setCurrentPlayer(newCurrentPlayer);
   }, [currentPlayer]);

   useEffect(() => {
      if (currentPlayer === 0) {
         const computerMove = generateComputerMove(gameBoard);
         movePiece(computerMove);
      }
   }, [currentPlayer, movePiece]);

   const content = new Array<JSX.Element>();
   for (let i = 0; i < 8; i++) {
      const rowCells = new Array<JSX.Element>();
      for (let j = 0; j < 8; j++) {
         const squareIndex = i * 8 + j;

         const piece = gameBoard.squares[squareIndex];
         
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