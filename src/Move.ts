import { PieceTypes } from "./Piece";

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

   public changePromotionFlag(pieceType: PieceTypes): void {
      switch (pieceType) {
         case PieceTypes.Queen: {
            this.flags = MoveFlags.IsQueenPromotion;
            break;
         }
         case PieceTypes.Rook: {
            this.flags = MoveFlags.IsRookPromotion;
            break;
         }
         case PieceTypes.Knight: {
            this.flags = MoveFlags.IsKnightPromotion;
            break;
         }
         case PieceTypes.Bishop: {
            this.flags = MoveFlags.IsBishopPromotion;
            break;
         }
      }
   }
}

export default Move;