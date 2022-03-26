import Piece from "./Piece";

export enum MoveFlags {
   None,
   IsCastling,
   QueenPromotion
}

class Move {
   public flags: MoveFlags;

   public piece: Piece;
   public targetSquare: number;

   constructor(piece: Piece, targetSquare: number, flags?: MoveFlags) {
      this.piece = piece;
      this.targetSquare = targetSquare;

      if (typeof flags !== "undefined") {
         this.flags = flags;
      } else {
         this.flags = MoveFlags.None
      }
   }
}

export default Move;