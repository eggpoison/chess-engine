import { PlayerColours } from "./computer-ai";
import Piece, { PieceTypes } from "./Piece";

const pieceValues: { [key in PieceTypes]: number } = {
   [PieceTypes.Queen]: 9,
   [PieceTypes.King]: 0, // Doesn't have a value as the values of each player's kings will cancel out
   [PieceTypes.Rook]: 5,
   [PieceTypes.Knight]: 3,
   [PieceTypes.Bishop]: 3,
   [PieceTypes.Pawn]: 1
}

export function evaluatePosition(squares: Array<Piece | null>, colour: PlayerColours): number {
   let evaluation = 0;

   for (let square = 0; square < 64; square++) {
      const piece = squares[square];

      if (piece !== null) {
         evaluation += pieceValues[piece.type] * (piece.colour === colour ? 1 : -1);
      }
   }

   return evaluation;
}