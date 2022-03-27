import Board from "./Board";
import Move, { MoveFlags } from "./Move";
import Piece, { PieceTypes } from "./Piece";

export enum PlayerColours {
   Black,
   White
}

const DIRECTION_OFFSETS: { [key: number]: number } = {
   0: -8,
   1: 1,
   2: 8,
   3: -1,
   4: -7,
   5: 9,
   6: 7,
   7: -9
};

const numSquaresToEdge = new Array<Array<number>>(64);
const precomputeMoveData = (): void => {
   for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
         const numNorth = i;
         const numEast = 7 - j;
         const numSouth = 7 - i;
         const numWest = j;

         const squareIndex = i * 8 + j;

         numSquaresToEdge[squareIndex] = [
            numNorth,
            numEast,
            numSouth,
            numWest,
            Math.min(numNorth, numEast),
            Math.min(numEast, numSouth),
            Math.min(numSouth, numWest),
            Math.min(numWest, numNorth)
         ];
      }
   }
}

const FEN_PIECE_REFERENCES: { [key: string]: PieceTypes } = {
   "k": PieceTypes.King,
   "q": PieceTypes.Queen,
   "r": PieceTypes.Rook,
   "n": PieceTypes.Knight,
   "b": PieceTypes.Bishop,
   "p": PieceTypes.Pawn
}

export function generateBoardFromFen(fen: string): Board {
   const squares = new Array<Piece | null>(64);
   
   const fields = fen.split(" ");

   const ranks = fields[0].split("/");
   console.log(ranks);
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

   const board = new Board(squares);
   console.log(board);
   return board;
}

export function setup(): void {
   precomputeMoveData();
}
setup();

export function applyMove(board: Board, move: Move): Board {
   move.piece.timesMoved++;
   
   // Make the new position
   const newBoard = new Board(board.squares, board.whiteAttackedSquares, board.blackAttackedSquares);

   switch (move.flags) {
      case MoveFlags.None: {
         // Move the piece from its previous position to its new one
         newBoard.squares[move.piece.square] = null;
         newBoard.squares[move.targetSquare] = move.piece;

         break;
      }

      case MoveFlags.IsCastling: {
         let rookStartSquare!: number;
         let rookTargetSquare!: number;

         if (move.targetSquare % 8 === 6) {
            // Kingside castle

            rookStartSquare = move.piece.square + 3;
            rookTargetSquare = move.targetSquare - 1;
         } else {
            // Queenside castle

            rookStartSquare = move.piece.square - 4;
            rookTargetSquare = move.targetSquare + 1;
         }

         // Move the rook behind the king
         const rook = newBoard.squares[rookStartSquare];
         newBoard.squares[rookStartSquare] = null;
         newBoard.squares[rookTargetSquare] = rook;

         // Move the king
         const king = newBoard.squares[move.piece.square];
         newBoard.squares[move.piece.square] = null;
         newBoard.squares[move.targetSquare] = king;

         break;
      }
   }

   move.piece.square = move.targetSquare;

   // Recalculate attacked squares
   if (move.piece.colour === PlayerColours.White) {
      newBoard.whiteAttackedSquares = Board.calculateAttackedSquares(newBoard, PlayerColours.White);
   } else {
      newBoard.blackAttackedSquares = Board.calculateAttackedSquares(newBoard, PlayerColours.Black);
   }

   return newBoard;
}

const generateSlidingMoves = (board: Board, piece: Piece, allowOwnColour: boolean): Array<Move> => {
   const startDirectionIndex = piece.type === PieceTypes.Bishop ? 4 : 0;
   const endDirectionIndex = piece.type === PieceTypes.Rook ? 4 : 8;

   const moves = new Array<Move>();

   for (let direction = startDirectionIndex; direction < endDirectionIndex; direction++) {
      for (let i = 0; i < numSquaresToEdge[piece.square][direction]; i++) {
         const targetSquare = piece.square + DIRECTION_OFFSETS[direction] * (i + 1);

         const targetPiece = board.squares[targetSquare];

         // Move is blocked by a friendly piece, so can't move any further
         if (targetPiece !== null && targetPiece.colour === piece.colour) {
            if (allowOwnColour) {
               const move = new Move(piece, targetSquare);
               moves.push(move);
            }

            break;
         }

         const move = new Move(piece, targetSquare);
         moves.push(move);

         // Captures enemy piece so can't move any further
         if (targetPiece !== null && targetPiece.colour !== piece.colour) {
            break;
         }
      }
   }

   return moves;
}

const generateMiscMoves = (board: Board, piece: Piece, allowOwnColour: boolean): Array<Move> => {
   const legalMoves = new Array<Move>();

   const addRegularMove = (targetSquare: number): void => {
      const move = new Move(piece, targetSquare);
      legalMoves.push(move);
   }

   switch (piece.type) {
      case PieceTypes.King: {
         const squaresToEdge = numSquaresToEdge[piece.square];

         // Surrounding squares
         for (let i = 0; i < 8; i++) {
            if (squaresToEdge[i] === 0) continue;

            const offset = DIRECTION_OFFSETS[i];

            const targetSquare = piece.square + offset;
            const targetPiece = board.squares[targetSquare];

            if (targetPiece === null || (targetPiece.colour !== piece.colour || allowOwnColour)) {
               addRegularMove(targetSquare);
            }
         }

         // If the king hasn't moved, try to castle
         if (piece.timesMoved === 0) {
            const rookSquareOffsets = [3, -4];
            const kingTargetSquareOffsets = [2, -2];

            for (let i = 0; i < 2; i++) {
               const rookSquareOffset = rookSquareOffsets[i];
               const kingTargetSquareOffset = kingTargetSquareOffsets[i];

               const rook = board.squares[piece.square + rookSquareOffset];
               
               // If the square isn't a rook or the rook has already moved, isn't legal move
               if (rook === null || rook.type !== PieceTypes.Rook || rook.timesMoved !== 0) {
                  continue;
               }

               // Make sure there are no pieces to interfere with castling
               let pieceIsInWay = false;
               const direction = Math.sign(rookSquareOffset);
               for (let j = 0; j < Math.abs(rookSquareOffset) - 1; j++) {
                  const square = piece.square + (j + 1) * direction;

                  // If there is a piece in the way, don't castle
                  const queryPiece = board.squares[square];
                  if (queryPiece !== null) {
                     pieceIsInWay = true;
                     break;
                  }
               }
               if (pieceIsInWay) continue;

               const move = new Move(piece, piece.square + kingTargetSquareOffset, MoveFlags.IsCastling);
               legalMoves.push(move);
            }
         }

         break;
      }
      case PieceTypes.Knight: {
         // maaagic

         const squaresToEdge = numSquaresToEdge[piece.square];

         for (let i = 0; i < 8; i++) {
            const half = Math.floor(i / 2);

            const cornerOffset = DIRECTION_OFFSETS[4 + half];

            const offsetIdx = (half + i % 2) % 4;
            const offset = DIRECTION_OFFSETS[offsetIdx];
            
            const mainSquaresToEdge = squaresToEdge[offsetIdx];
            const minorSquaresToEdge = squaresToEdge[(half + 1 - i % 2) % 4];
            
            if (mainSquaresToEdge < 2 || minorSquaresToEdge === 0) continue;

            const targetSquare = piece.square + cornerOffset + offset;
            const targetPiece = board.squares[targetSquare];
            if (!(targetPiece !== null && (targetPiece.colour === piece.colour && !allowOwnColour))) {
               addRegularMove(targetSquare);
            }
         }

         break;
      }
      case PieceTypes.Pawn: {
         const direction = piece.colour === PlayerColours.White ? -1 : 1;

         // Forwards move
         const targetSquare = piece.square + 8 * direction;
         if (!allowOwnColour && board.squares[targetSquare] === null) {
            addRegularMove(targetSquare);
         }

         // Double move
         if (!allowOwnColour && Math.floor(piece.square / 8) === (piece.colour === PlayerColours.White ? 6 : 1)) {
            const targetSquare = piece.square + (piece.colour === PlayerColours.White ? -16 : 16);
            addRegularMove(targetSquare);
         }

         // Capture moves
         for (let i = 0; i < 2; i++) {
            const xOffset = i === 0 ? -1 : 1;

            // Stop from wrapping around
            if ((xOffset === -1 && piece.square % 8 === 0) || (xOffset === 1 && piece.square % 8 === 7)) continue;

            const targetSquare = piece.square + 8 * direction + xOffset;
            const targetPiece = board.squares[targetSquare];

            if (allowOwnColour || (targetPiece !== null && targetPiece.colour !== piece.colour)) {
               addRegularMove(targetSquare);
            }
         }

         break;
      }
   }

   return legalMoves;
}

/**
 * Generates all possible moves for a piece
 * @param board The board
 * @param piece The piece
 * @param allowOwnColour If true, the function will include moves which attack its own pieces
 */
export function generatePieceMoves(board: Board, piece: Piece, allowOwnColour: boolean = false): Array<Move> {
   const slidingPieces = [PieceTypes.Rook, PieceTypes.Bishop, PieceTypes.Queen];

   if (slidingPieces.includes(piece.type)) {
      return generateSlidingMoves(board, piece, allowOwnColour);
   } else {
      return generateMiscMoves(board, piece, allowOwnColour);
   }
}

const generateAllPossibleMoves = (board: Board, colour: PlayerColours): Array<Move> => {
   let moves = new Array<Move>();
   for (let square = 0; square < 64; square++) {
      const piece = board.squares[square];
      if (piece === null || piece.colour !== colour) continue;
         
      const pieceMoves = generatePieceMoves(board, piece);
      moves = moves.concat(pieceMoves);
   }

   return moves;
}

export function generateComputerMove(board: Board): Move {
   const moves: Array<Move> = generateAllPossibleMoves(board, PlayerColours.Black);

   const randomMove = moves[Math.floor(Math.random() * moves.length)];
   return randomMove;
}