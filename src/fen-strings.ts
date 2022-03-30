import Board from "./Board";
import { PlayerColours } from "./computer-ai";
import Piece, { PieceTypes } from "./Piece";

const FEN_PIECE_REFERENCES: { [key: string]: PieceTypes } = {
   "k": PieceTypes.King,
   "q": PieceTypes.Queen,
   "r": PieceTypes.Rook,
   "n": PieceTypes.Knight,
   "b": PieceTypes.Bishop,
   "p": PieceTypes.Pawn
}

export function generateBoardFromFenString(fenString: string): Board {
    const fields = fenString.split(" ");
    
    const squares = new Array<Piece | null>(64);
    const ranks = fields[0].split("/");
    for (let i = 0; i < 8; i++) {
       const rank = ranks[i];
 
       let square = i * 8;
       for (const char of rank.split("")) {
          // If the character is a number, skip that number of squares
          const num = Number(char);
          const charIsNumber = !isNaN(num);
          if (charIsNumber) {
             // Fill the skipped squares with null
             for (let j = 0; j < num; j++) {
                squares[square + j] = null;
             }
 
             square += num;
             continue;
          }
 
          const lowerChar = char.toLowerCase();
 
          // Get the piece colour
          const pieceColour: PlayerColours = char === lowerChar ? PlayerColours.Black : PlayerColours.White;
 
          // Add the piece to the board squares
          const pieceType: PieceTypes = FEN_PIECE_REFERENCES[lowerChar];
          const piece = new Piece(pieceType, pieceColour, square);
          squares[square] = piece;
 
          square++;
       }
    }
 
    const activeColour = fields[1] === "w" ? PlayerColours.White : PlayerColours.Black;
 
    const castlingRights = fields[2] === "-" ? 0 : Board.generateCastlingRights(fields[2]);
 
    const board = new Board(squares, activeColour, castlingRights);
    return board;
}

export function generateFenStringFromBoard(board: Board): void {
    let result: string = "";

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const squareIndex = i * 8 + j;

            
        }
    }
}