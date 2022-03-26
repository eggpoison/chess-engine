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
   public readonly type: PieceTypes;

   public square: number;
   public timesMoved: number = 0;

   constructor(type: PieceTypes, colour: PlayerColours, square: number) {
      this.type = type;
      this.colour = colour;
      this.square = square;
   }
}

export default Piece;