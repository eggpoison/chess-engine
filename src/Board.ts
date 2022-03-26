import { generatePieceMoves, PlayerColours } from "./computer-ai";
import Piece from "./Piece";

interface AttackedSquares {
   [key: number]: Array<Piece>;
}

class Board {
   public squares: Array<Piece | null>;

   public whiteAttackedSquares: AttackedSquares;
   public blackAttackedSquares: AttackedSquares;

   constructor(squares: Array<Piece | null>, whiteAttackedSquares?: AttackedSquares, blackAttackedSquares?: AttackedSquares) {
      this.squares = squares;

      if (typeof whiteAttackedSquares !== "undefined") {
         this.whiteAttackedSquares = whiteAttackedSquares;
      } else {
         this.whiteAttackedSquares = Board.calculateAttackedSquares(this, PlayerColours.White);
      }

      if (typeof blackAttackedSquares !== "undefined") {
         this.blackAttackedSquares = blackAttackedSquares;
      } else {
         this.blackAttackedSquares = Board.calculateAttackedSquares(this, PlayerColours.Black);
      }
   }

   /**
    * Calculate which squares are being attacked by a colour
    * @param board The board
    * @param colour The colour of the attacked squares
    */
   static calculateAttackedSquares(board: Board, colour: PlayerColours): AttackedSquares {
      const attackedSquares: AttackedSquares = {};

      for (const piece of board.squares) {
         if (piece === null || piece.colour !== colour) continue;

         const attackingMoves = generatePieceMoves(board, piece, true);

         for (const move of attackingMoves) {
            if (attackedSquares.hasOwnProperty(move.targetSquare)) {
               attackedSquares[move.targetSquare].push(piece);
            } else {
               attackedSquares[move.targetSquare] = [piece];
            }
         }
      }

      return attackedSquares;
   }
}

export default Board; 