import { PlayerColours } from "./computer-ai";
import Piece from "./Piece";

class Board {
   public squares: Array<Piece | null>;

   public whiteAttackedSquares: Array<number>;
   public blackAttackedSquares: Array<number>;

   constructor(squares: Array<Piece | null>, whiteAttackedSquares?: Array<number>, blackAttackedSquares?: Array<number>) {
      this.squares = squares;

      if (typeof whiteAttackedSquares !== "undefined") {
         this.whiteAttackedSquares = whiteAttackedSquares;
      } else {
         this.whiteAttackedSquares = Board.calculateAttackedSquares(squares, PlayerColours.White);
      }

      if (typeof blackAttackedSquares !== "undefined") {
         this.blackAttackedSquares = blackAttackedSquares;
      } else {
         this.blackAttackedSquares = Board.calculateAttackedSquares(squares, PlayerColours.Black);
      }
   }

   static calculateAttackedSquares(squares: Array<Piece | null>, colour: PlayerColours): Array<number> {
      return [0];
   }
}

export default Board; 