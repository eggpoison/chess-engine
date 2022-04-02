import Board from "./Board";
import { PlayerColours } from "./computer-ai";
import { PieceTypes } from "./Piece";
import PIECE_SQUARE_TABLES from "./piece-square-tables";

const pieceValues: { [key in PieceTypes]: number } = {
   [PieceTypes.Queen]: 9,
   [PieceTypes.King]: 999,
   [PieceTypes.Rook]: 5,
   [PieceTypes.Knight]: 3,
   [PieceTypes.Bishop]: 3,
   [PieceTypes.Pawn]: 1
}

export function getPieceValue(pieceType: PieceTypes): number {
   return pieceValues[pieceType];
}

const evaluateMaterialValue = (board: Board, colour: PlayerColours): number => {
   let totalValue = 0;

   for (let i = 0; i < 6; i++) {
      const pieceType = i as PieceTypes;

      for (const piece of board.pieces[colour][pieceType]) {
         const pieceValue = getPieceValue(piece.type);
         
         // Evaluate the piece square tables
         const pieceRank = Math.floor(piece.square / 8);
         // If the player is white, flip the square value table
         const squareValueIndex = colour === PlayerColours.White ? piece.square - pieceRank * 16 + 56 : piece.square;
         const squareValue = PIECE_SQUARE_TABLES[piece.colour][squareValueIndex] / 100;

         totalValue += pieceValue + squareValue;
      }
   }

   return totalValue;
}

const evaluateColour = (board: Board, colour: PlayerColours): number => {
   let value = 0;

   value += evaluateMaterialValue(board, colour);
   
   // Reward checks
   const enemyKingSquare = board.pieces[colour ? 0 : 1][PieceTypes.King][0].square;
   const isCheckingOpponent = board.squaresBeingAttackedBy[colour].hasOwnProperty(enemyKingSquare);

   return value;
}

export function evaluatePosition(board: Board, colour: PlayerColours): number {
   const whiteEvaluation = evaluateColour(board, PlayerColours.White);
   const blackEvaluation = evaluateColour(board, PlayerColours.Black);

   const perspective = colour === PlayerColours.White ? 1 : -1;
   const evaluation = (whiteEvaluation - blackEvaluation) * perspective;

   return evaluation;
}