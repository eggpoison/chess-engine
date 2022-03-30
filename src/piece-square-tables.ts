import { PieceTypes } from "./Piece";

// Kindly yoinked from:
// https://andreasstckl.medium.com/writing-a-chess-program-in-one-day-30daff4610ec

// 63 -> 7 (-56), 3 -> 59 (56), 18 -> 42 (24), 26 -> 34 (8)

/*
0: 56 (0)
1: 40 (-16)
2: 24 (-32) (24)
3: 8 (-48) (8)
4: -8
5: -16
-16r + 56
*/

const PIECE_SQUARE_TABLES: { [key in PieceTypes]: ReadonlyArray<number> } = {
    [PieceTypes.Queen]: [
        -20,-10,-10, -5, -5,-10,-10, -20,
        -10,  0,  0,  0,  0,  0,  0, -10,
        -10,  5,  5,  5,  5,  5,  0, -10,
          0,  0,  5,  5,  5,  5,  0,  -5,
         -5,  0,  5,  5,  5,  5,  0,  -5,
        -10,  0,  5,  5,  5,  5,  0, -10,
        -10,  0,  0,  0,  0,  0,  0, -10,
        -20,-10,-10, -5, -5,-10,-10, -20
    ],
    [PieceTypes.King]: [
         20, 30, 10,  0,  0, 10, 30,  20,
         20, 20,  0,  0,  0,  0, 20,  20,
        -10,-20,-20,-20,-20,-20,-20, -10,
        -20,-30,-30,-40,-40,-30,-30, -20,
        -30,-40,-40,-50,-50,-40,-40, -30,
        -30,-40,-40,-50,-50,-40,-40, -30,
        -30,-40,-40,-50,-50,-40,-40, -30,
        -30,-40,-40,-50,-50,-40,-40, -30
    ],
    [PieceTypes.Rook]: [
          0,  0,  0,  5,  5,  0,  0,  0,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
         -5,  0,  0,  0,  0,  0,  0, -5,
          5, 10, 10, 10, 10, 10, 10,  5,
          0,  0,  0,  0,  0,  0,  0,  0
    ],
    [PieceTypes.Knight]: [
        -50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50
    ],
    [PieceTypes.Bishop]: [
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -20,-10,-10,-10,-10,-10,-10,-20
    ],
    [PieceTypes.Pawn]: [
          0,  0,  0,  0,  0,  0,  0,  0,
          5, 10, 10,-20,-20, 10, 10,  5,
          5, -5,-10,  0,  0,-10, -5,  5,
          0,  0,  0, 20, 20,  0,  0,  0,
          5,  5, 10, 25, 25, 10,  5,  5,
         10, 10, 20, 30, 30, 20, 10, 10,
         50, 50, 50, 50, 50, 50, 50, 50,
          0,  0,  0,  0,  0,  0,  0,  0
    ]
};

export default PIECE_SQUARE_TABLES;