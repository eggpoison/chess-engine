import { useCallback, useEffect, useRef, useState } from "react";
import AudioFromFile from "../AudioFromFile";
import Board, { GameResults } from "../Board";
import { generateComputerMove, generatePieceMoves, PlayerColours, validatePseudoLegalMoves } from "../computer-ai";
import { generateBoardFromFenString } from "../fen-strings";
import Move, { MoveFlags } from "../Move";
import Piece, { PieceTypes } from "../Piece";
import SETTINGS from "../settings";

const startingPositionFenString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
// const startingPositionFenString = "7k/8/P7/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1";
export let gameBoard: Board = generateBoardFromFenString(startingPositionFenString);

const getIconOffset = (piece: Piece): [number, number] => {
   const x = piece.type;
   const y = piece.colour;

   return [x, y];
}


let colouredBoardSquareIndexes = new Array<number>();
const boardSquares = new Array<HTMLElement>(64);

type BoardSquareColourType = "Potential move" | "Piece previous position";
export function colourBoardSquare(square: number, colourType: BoardSquareColourType): void {
   const boardSquare = boardSquares[square];
   
   switch (colourType) {
      case "Potential move": {
         boardSquare.classList.add("legal-move");
         break;
      }
      case "Piece previous position": {
         boardSquare.classList.add("previous-move");
         break;
      }
   }

   colouredBoardSquareIndexes.push(square);
}
export function uncolourBoardSquare(square: number): void {
   const potentialClassNames: ReadonlyArray<string> = ["legal-move", "previous-move"];

   const boardSquare = boardSquares[square];
   for (const className of potentialClassNames) {
      boardSquare.classList.remove(className);
   }

   colouredBoardSquareIndexes.splice(colouredBoardSquareIndexes.indexOf(square), 1); 
}

const clearBoardSquareColours = (): void => {
   const squareIndexesToClear = colouredBoardSquareIndexes.slice();
   for (const square of squareIndexesToClear) {
      uncolourBoardSquare(square);
   }
}

interface PieceIconProps {
   piece: Piece;
   movePiece: (move: Move) => void;
}
const PieceIcon = ({ piece, movePiece }: PieceIconProps) => {
   const elemRef = useRef<HTMLDivElement>(null);
   const moves = useRef<Array<Move> | null>(null);

   const [xOffset, yOffset] = getIconOffset(piece);
   const style: React.CSSProperties = {
      backgroundPositionX: `-${xOffset * SETTINGS.iconSize}px`,
      backgroundPositionY: `${yOffset * SETTINGS.iconSize}px`
   }

   const startMove = (): void => {
      // Generate legal moves
      const pseudoLegalMoves = generatePieceMoves(gameBoard, piece);
      const legalMoves = validatePseudoLegalMoves(gameBoard, pseudoLegalMoves, piece.colour, true);

      moves.current = legalMoves;

      // Colour squares with legal moves
      for (const legalMove of moves.current) {
         colourBoardSquare(legalMove.targetSquare, "Potential move");
      }

      const elem = elemRef.current!;
      elem.classList.add("dragging");
   }

   const mouseMove = useCallback((): void => {
      const event = window.event as MouseEvent;

      const x = event.clientX;
      const y = event.clientY;

      const boardBounds = document.getElementById("board")!.getBoundingClientRect();
      const pieceBounds = elemRef.current!.getBoundingClientRect();

      const elem = elemRef.current!;
      elem.style.left = x - boardBounds.x - pieceBounds.width/2 + "px";
      elem.style.top = y - boardBounds.y - pieceBounds.height/2 + "px";
   }, []);

   const mouseUp = useCallback((): void => {
      const startX = piece.square % 8;
      const startY = Math.floor(piece.square / 8);

      const uncolourMoves = (): void => {
         // Uncolour the squares with legal moves
         for (const move of moves.current!) {
            uncolourBoardSquare(move.targetSquare);
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

         uncolourMoves();
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
      for (const move of moves.current!) {
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
         for (const currentMove of moves.current!) {
            if (currentMove.targetSquare === targetSquare) {
               move = currentMove;
               break;
            }
         }

         // Move the piece
         movePiece(move);

         document.removeEventListener("mouseup", mouseUp);
         document.removeEventListener("mousemove", mouseMove);
      } else {
         cancelMove();
      }
   }, [movePiece, piece, mouseMove]);

   const mouseDown = (): void => {
      const canMove = gameBoard.currentPlayer === PlayerColours.White;
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
   }, [mouseUp, mouseMove]);

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

export const Game = () => {
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const [value, setValue] = useState(0);
   const gameResult = useRef<GameResults>(GameResults.None);
   const boardRef = useRef<HTMLDivElement | null>(null);

   const updateBoard = useCallback(() => {
      setValue(value => value + 1);
   }, []);

   // 58 -> 23

   // useEffect(() => {
   //    setTimeout(() => {
   //       const castlingRightsBeforeMove = gameBoard.castlingRights;
   //       const move = new Move(58, 23);
   //       gameBoard.makeMove(move);
   //       updateBoard();

   //       setTimeout(() => {
   //          gameBoard.undoMove(move, castlingRightsBeforeMove);
   //          updateBoard();
   //       }, 500);
   //    }, 500);
   // }, []);

   // useEffect(() => {
   //    const colour = PlayerColours.White;

   //    for (let i = 0; i < 64; i++) {
   //       const squareElem = boardSquares[i];
   //       if (gameBoard.attackedSquares[colour].hasOwnProperty(i)) {
   //          squareElem.style.backgroundColor = "blue";
   //       } else {
   //          squareElem.style.backgroundColor = "red";
   //       }
   //    }
   // }, [value]);

   const endGame = (winningColour: PlayerColours | null): void => {
      const board = boardRef.current!;
      board.classList.add("game-ended");

      switch (winningColour) {
         case null: {
            gameResult.current! = GameResults.Stalemate;
            break;
         }
         case PlayerColours.White: {
            gameResult.current! = GameResults.WhiteWin;
            break;
         }
         case PlayerColours.Black: {
            gameResult.current! = GameResults.BlackWin;
            break;
         }
      }
   }

   const movePiece = useCallback((move: Move): void => {
      const makeComputerMove = (): void => {
         setTimeout(() => {
            const computerMove = generateComputerMove(gameBoard);
            movePiece(computerMove);
         }, 50);
      }

      // Uncolour previously coloured board squares
      clearBoardSquareColours();

      // Colour the board squares
      colourBoardSquare(move.startSquare, "Piece previous position");
      colourBoardSquare(move.targetSquare, "Piece previous position");

      const colour = gameBoard.squares[move.startSquare]!.colour;
      const targetPiece = gameBoard.squares[move.targetSquare];

      // Make the new position
      gameBoard.makeMove(move);

      let enemyKingSquare!: number;
      for (let square = 0; square < 64; square++) {
         const piece = gameBoard.squares[square];
         if (piece !== null && piece.type === PieceTypes.King && piece.colour !== colour) {
            enemyKingSquare = square;
            break;
         }
      }

      // Check if the move checkmated the enemy
      const enemyColour = colour ? 0 : 1;
      const isCheckmate = gameBoard.isCheckmate(enemyColour);

      const attackedSquares = gameBoard.squaresBeingAttackedBy[colour];
      const hasCheckedEnemyKing = attackedSquares.hasOwnProperty(enemyKingSquare);

      if (isCheckmate) {
         endGame(colour);
         new AudioFromFile("win.mp3");
      } else if (hasCheckedEnemyKing) {
         new AudioFromFile("check.mp3");
      } else {
         switch (move.flags) {
            case MoveFlags.None: {
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
      }

      // Switch current player
      const newCurrentPlayer = gameBoard.currentPlayer ? 0 : 1;
      gameBoard.currentPlayer = newCurrentPlayer;
      updateBoard();

      // If the computer is the current player, make its move
      if (!gameResult.current && gameBoard.currentPlayer === PlayerColours.Black) {
         makeComputerMove();
      }
   }, [updateBoard]);

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

   return <>
      <div id="board" ref={boardRef}>
         {content}
      </div>

      {gameResult.current === GameResults.None ? (
         <h1 id="current-player">{gameBoard.currentPlayer === PlayerColours.White ? "White To Move" : "Black To Move"}</h1>
      ) : (
         <h1 id="game-end-message">{gameResult.current === GameResults.Stalemate ? "Stalemate" : gameResult.current === GameResults.WhiteWin ? "White wins!" : "Black wins!"}</h1>
      )}
   </>;
}