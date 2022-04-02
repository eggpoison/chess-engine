import { PlayerColours } from "./computer-ai";

export enum PieceTypes {
   Queen,
   King,
   Rook,
   Knight,
   Bishop,
   Pawn
}

class Piece {
   public readonly colour: PlayerColours;
   public type: PieceTypes;

   public square: number;

   public previousAttackedSquares: Array<number> = new Array<number>();

   constructor(type: PieceTypes, colour: PlayerColours, square: number) {
      this.type = type;
      this.colour = colour;
      this.square = square;
   }
}

export default Piece;