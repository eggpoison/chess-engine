import Board from "./Board";
import { PlayerColours } from "./computer-ai";
import Piece, { PieceTypes } from "./Piece";
import PIECE_SQUARE_TABLES from "./piece-square-tables";

const pieceValues: { [key in PieceTypes]: number } = {
   [PieceTypes.Queen]: 9,
   [PieceTypes.King]: 999,
   [PieceTypes.Rook]: 5,
   [PieceTypes.Knight]: 3,
   [PieceTypes.Bishop]: 3,
   [PieceTypes.Pawn]: 1
}

const evaluateMaterialValue = (board: Board, colour: PlayerColours): number => {
   const pieces = board.pieces[colour];

   let totalValue = 0;

   for (let i = 0; i < 6; i++) {
      const pieceType = i as PieceTypes;

      for (const piece of pieces[pieceType]) {
         const pieceValue = pieceValues[piece.type];

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

   return value;
}

export function evaluatePosition(board: Board, colour: PlayerColours): number {
   // let evaluation = 0;

   // const squares = board.squares;
   // for (let squareIndex = 0; squareIndex < 64; squareIndex++) {
   //    const piece = squares[squareIndex];
   //    // If there isn't a piece on that square, go to the next square
   //    if (piece === null) continue;

   //    const pieceValue = pieceValues[piece.type];

   //    const pieceRank = Math.floor(squareIndex / 8);
   //    // If the player is white, flip the square value table
   //    const squareValueIndex = colour === PlayerColours.White ? squareIndex - pieceRank * 16 + 56 : squareIndex;
   //    const squareValue = PIECE_SQUARE_TABLES[piece.colour][squareValueIndex] / 100;

   //    const perspective = piece.colour === colour ? 1 : -1;
   //    evaluation += (pieceValue + squareValue) * perspective;
   // }

   const whiteEvaluation = evaluateColour(board, PlayerColours.White);
   const blackEvaluation = evaluateColour(board, PlayerColours.Black);

   const perspective = colour === PlayerColours.White ? 1 : -1;
   const evaluation = (whiteEvaluation - blackEvaluation) * perspective;

   return evaluation;
}