export enum MoveFlags {
   None,
   IsCastling,
   QueenPromotion
}

class Move {
   public flags: MoveFlags;

   public startSquare: number;
   public targetSquare: number;

   constructor(startSquare: number, targetSquare: number, flags?: MoveFlags) {
      this.startSquare = startSquare;
      this.targetSquare = targetSquare;

      if (typeof flags !== "undefined") {
         this.flags = flags;
      } else {
         this.flags = MoveFlags.None
      }
   }
}

export default Move;