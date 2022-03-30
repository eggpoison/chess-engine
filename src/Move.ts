export enum MoveFlags {
   None,
   IsCastling,
   IsQueenPromotion,
   IsRookPromotion,
   IsKnightPromotion,
   IsBishopPromotion
}

export function getPromotionFlags(): Array<MoveFlags> {
   return [MoveFlags.IsQueenPromotion, MoveFlags.IsRookPromotion, MoveFlags.IsKnightPromotion, MoveFlags.IsBishopPromotion];
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

   public isPromoting(): boolean {
      const promotionFlags = getPromotionFlags();
      return promotionFlags.includes(this.flags);
   }
}

export default Move;