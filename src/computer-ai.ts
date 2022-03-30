import Board, { CastlingIndexes } from "./Board";
import { evaluatePosition } from "./evaluation";
import Move, { getPromotionFlags, MoveFlags } from "./Move";
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

precomputeMoveData();

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
               const move = new Move(piece.square, targetSquare);
               moves.push(move);
            }

            break;
         }

         const move = new Move(piece.square, targetSquare);
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
   const moves = new Array<Move>();

   const addRegularMove = (targetSquare: number): void => {
      const move = new Move(piece.square, targetSquare);
      moves.push(move);
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

         // Try to castle
         const rookSquareOffsets = [3, -4];
         const kingTargetSquareOffsets = [2, -2];
         
         for (let i = 0; i < 2; i++) {
            // Check if castling is possible
            let castlingIndex = i === 0 ? "k" : "q";
            if (piece.colour === 1) castlingIndex = castlingIndex.toUpperCase();

            const canCastle = board.canCastle(castlingIndex as keyof typeof CastlingIndexes);
            if (!canCastle) continue;

            const rookSquareOffset = rookSquareOffsets[i];
            const kingTargetSquareOffset = kingTargetSquareOffsets[i];

            const rook = board.squares[piece.square + rookSquareOffset];
            
            // If the square isn't a rook or the rook has already moved, isn't legal move
            if (rook === null || rook.type !== PieceTypes.Rook) {
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

            const move = new Move(piece.square, piece.square + kingTargetSquareOffset, MoveFlags.IsCastling);
            moves.push(move);
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

         const rank = Math.floor(piece.square / 8);

         // Forwards move
         const targetSquare = piece.square + 8 * direction;
         if (!allowOwnColour && board.squares[targetSquare] === null) {
            // If the pawn can promote
            const pawnCanPromote = (rank === 1 && piece.colour === PlayerColours.White) || (rank === 6 && piece.colour === PlayerColours.Black);

            if (pawnCanPromote) {
               const promotionFlags = getPromotionFlags();

               for (const promotionFlag of promotionFlags) {
                  const move = new Move(piece.square, targetSquare, promotionFlag);
                  moves.push(move);
               }
            } else {
               addRegularMove(targetSquare);
            }
         }

         // Double move
         if (!allowOwnColour && rank === (piece.colour === PlayerColours.White ? 6 : 1)) {
            // Make sure the pawn doesn't pass through any pieces
            let moveIsAllowed = true;
            const direction = piece.colour === PlayerColours.White ? -8 : 8;
            for (let i = 0; i < 2; i++) {
               const square = piece.square + (i + 1) * direction;

               // If it does, cancel the move
               if (board.squares[square] !== null) {
                  moveIsAllowed = false;
                  break;
               }
            }

            if (moveIsAllowed) {
               const targetSquare = piece.square + (piece.colour === PlayerColours.White ? -16 : 16);
               addRegularMove(targetSquare);
            }
         }

         // Don't capture if the pawn is on the last rank
         const isInvalidCapture = rank === 0 || rank === 7;

         // Capture moves
         if (!isInvalidCapture) {
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
         }

         break;
      }
   }

   return moves;
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

const generatePseudoLegalMoves = (board: Board, colour: PlayerColours): Array<Move> => {
   let moves = new Array<Move>();
   for (let square = 0; square < 64; square++) {
      const piece = board.squares[square];
      if (piece === null || piece.colour !== colour) continue;
         
      const pieceMoves = generatePieceMoves(board, piece);
      moves = moves.concat(pieceMoves);
   }

   return moves;
}

export function validatePseudoLegalMoves(board: Board, pseudoLegalMoves: Array<Move>, colour: PlayerColours, m: boolean = false): Array<Move> {
   const legalMoves = new Array<Move>();

   const opponentColour = colour ? 0 : 1;
   for (const moveToVerify of pseudoLegalMoves) {

      const castlingRightsBeforeMove = board.castlingRights;

      // Generate all possible responses to the move
      board.makeMove(moveToVerify);
      const opponentResponses: Array<Move> = generatePseudoLegalMoves(board, opponentColour);
      
      // Find my king
      // This has to be done during the loop as the king may move
      let kingSquare!: number;
      for (let square = 0; square < 64; square++) {
         const piece = board.squares[square];
         if (piece !== null && piece.type === PieceTypes.King && piece.colour === colour) {
            kingSquare = square;
            break;
         }
      }
      if (typeof kingSquare === "undefined") {
         throw new Error("You have no king!");
      }

      if (opponentResponses.some(move => move.targetSquare === kingSquare)) {
         // The opponent captured my king, my move must have been illegal
      } else {
         legalMoves.push(moveToVerify);
      }

      board.undoMove(moveToVerify, castlingRightsBeforeMove);
   }

   return legalMoves;
}

/**
 * Generates all possible legal moves for a player to make
 * @param board The board
 * @param colour The colour of the player to generate moves for
 */
export function generateLegalMoves(board: Board, colour: PlayerColours): Array<Move> {
   const pseudoLegalMoves: Array<Move> = generatePseudoLegalMoves(board, colour);
   const legalMoves: Array<Move> = validatePseudoLegalMoves(board, pseudoLegalMoves, colour);
   return legalMoves;
}

const SEARCH_DEPTH = 4;

// Generate all possible moves that the computer than make then evaluate those positions recursively
// Make the move that maximises the result of the evaluation function
const search = (board: Board, depth: number, colour: PlayerColours, alpha: number = -1000, beta: number = 1000): number | Move => {
   // If the max depth is reached, return the position's evaluation
   if (depth === 0) {
      // As opposed to just counting up the position's value, account for any captures the opponent could make on the next move.
      return evaluatePosition(board, colour);
   }

   let bestMove!: Move;

   const playerMoves = generateLegalMoves(board, colour);

   // TODO: Make a more efficient way of getting piece squares than a loop
   // Check if it is checkmate or stalemate
   // if (playerMoves.length === 0) {

   // }

   if (playerMoves.length === 0) {
      let kingSquareIndex!: number;
      for (let squareIndex = 0; squareIndex < 64; squareIndex++) {
         const piece = board.squares[squareIndex];
         if (piece?.type === PieceTypes.King && piece.colour === colour) {
            kingSquareIndex = squareIndex;
            break;
         }
      }

      // If you are in checkmate, return negative infinity
      if (board.squaresBeingAttackedBy[colour].hasOwnProperty(kingSquareIndex)) {
         return -999999;
      }

      // Otherwise if it's a stalemate, return 0
      return 0;
   }
   
   // For every move, see what the evaluation of the best response for the opponent is.
   for (const move of playerMoves) {
      const castlingRightsBeforeMove = board.castlingRights;
      board.makeMove(move);

      const obamaGaming = board.lastCapturedPiece.slice() as [Piece | null, Piece | null];
      /** How good the opponent's best response is. */
      const moveEvaluation: number = -search(board, depth - 1, colour ? 0 : 1, -beta, -alpha);
      board.lastCapturedPiece = obamaGaming;

      board.undoMove(move, castlingRightsBeforeMove);

      // If the opponent's response was too good, prune this branch so no time is wasted
      if (moveEvaluation >= beta) {
         return beta;
      }

      if (moveEvaluation > alpha) {
         alpha = moveEvaluation;
         bestMove = move;
      }
   }

   if (depth === SEARCH_DEPTH) {
      return bestMove;
   } else {
      return alpha;
   }
}

export function generateComputerMove(board: Board): Move {
   // Uncomment the following lines to use random move generation

   // const moves: Array<Move> = generateLegalMoves(board, PlayerColours.Black);
   // const randomMove = moves[Math.floor(Math.random() * moves.length)];
   // return randomMove;

   const move: Move = search(board, SEARCH_DEPTH, PlayerColours.Black) as Move;
   return move;
}