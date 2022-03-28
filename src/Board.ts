import { generateLegalMoves, generatePieceMoves, PlayerColours } from "./computer-ai";
import Move, { MoveFlags } from "./Move";
import Piece, { PieceTypes } from "./Piece";

interface AttackedSquares {
   [key: number]: Array<Piece>;
}

export enum CastlingIndexes {
   "K" = 8,
   "Q" = 4,
   "k" = 2,
   "q" = 1
}

export enum GameResults {
   None,
   Stalemate,
   BlackWin,
   WhiteWin,
}

class Board {
   public squares: Array<Piece | null>;

   public attackedSquares: [AttackedSquares, AttackedSquares] = [[], []];

   public currentPlayer: PlayerColours;
   public castlingRights: number;

   // Stores the last captured piece of each colour
   // So the white lastCapturedPiece stores the last captured white piece
   private lastCapturedPiece: [Piece | null, Piece | null] = [null, null];

   constructor(squares: Array<Piece | null>, currentPlayer: PlayerColours, castlingRights: number) {
      this.squares = squares;
      this.currentPlayer = currentPlayer;
      this.castlingRights = castlingRights;

      this.attackedSquares[PlayerColours.White] = Board.calculateAttackedSquares(this, PlayerColours.White);
      this.attackedSquares[PlayerColours.Black] = Board.calculateAttackedSquares(this, PlayerColours.Black);
   }

   static generateCastlingRights(rawData: string): number {
      let castlingRights = 0;
      for (const char of rawData.split("")) {
         const val = CastlingIndexes[char as keyof typeof CastlingIndexes];
         castlingRights += val;
      }
      return castlingRights;
   }

   public canCastle(char: keyof typeof CastlingIndexes): boolean {
      const val = CastlingIndexes[char];

      return (this.castlingRights & val) === val;
   }

   /**
    * Calculate which squares are being attacked by a colour
    * @param board The board
    * @param colour The colour of the attacked squares
    */
   static calculateAttackedSquares(board: Board, colour: PlayerColours): AttackedSquares {
      const attackedSquares: AttackedSquares = {};

      for (const piece of board.squares) {
         if (piece === null || piece.colour !== colour) continue;

         const attackingMoves = generatePieceMoves(board, piece, true);

         for (const move of attackingMoves) {
            if (attackedSquares.hasOwnProperty(move.targetSquare)) {
               attackedSquares[move.targetSquare].push(piece);
            } else {
               attackedSquares[move.targetSquare] = [piece];
            }
         }
      }

      return attackedSquares;
   }

   private updateCastlingRights(move: Move, type: "make" | "unmake", castlingRightsBeforeMove?: number): void {
      let piece!: Piece;
      if (type === "make") {
         piece = this.squares[move.startSquare]!;
      } else {
         piece = this.squares[move.targetSquare]!;
      }

      const colour = piece.colour;

      let castleIndexes: Array<keyof typeof CastlingIndexes> = new Array<keyof typeof CastlingIndexes>();
      if (piece.type === PieceTypes.King) {
         castleIndexes = ["k", "q"];
      } else {
         // Check if the rook is kingside or queenside
         if (move.startSquare % 8 === 0) {
            // Kingside
            castleIndexes = ["k"];
         } else {
            // Queenside
            castleIndexes = ["q"]
         }
      }

      if (colour === PlayerColours.White) {
         castleIndexes = castleIndexes.map(index => index.toUpperCase() as keyof typeof CastlingIndexes);
      }

      for (const index of castleIndexes) {
         const rights = CastlingIndexes[index];

         if (typeof castlingRightsBeforeMove !== "undefined") {
            const hadCastledBeforeMove = (castlingRightsBeforeMove & rights) === rights;
            if (!hadCastledBeforeMove) {
               continue;
            }
         }

         const canCastle = this.canCastle(index);
         if (type === "make" && canCastle) {
            this.castlingRights -= rights;
         } else if (type === "unmake" && !canCastle) {
            this.castlingRights += rights;
         }
      }
   }

   makeMove(move: Move): void {
      const movingPiece = this.squares[move.startSquare]!;

      // If the piece is a king or a rook, remove the possibility to castle
      if (movingPiece.type === PieceTypes.King || movingPiece.type === PieceTypes.Rook) {
         this.updateCastlingRights(move, "make");
      }

      // Update the captured piece
      const opposingColour = +!movingPiece.colour;
      const targetPiece = this.squares[move.targetSquare];
      if (targetPiece !== null) {
         this.lastCapturedPiece[opposingColour] = targetPiece;
      } else {
         this.lastCapturedPiece[opposingColour] = null;
      }

      // Move the piece from its previous position to its new one
      this.squares[move.startSquare] = null;
      this.squares[move.targetSquare] = movingPiece;
   
      switch (move.flags) {
         // Castling
         case MoveFlags.IsCastling: {
            let rookStartSquare!: number;
            let rookTargetSquare!: number;
   
            if (move.targetSquare % 8 === 6) {
               // Kingside castle
               rookStartSquare = move.startSquare + 3;
               rookTargetSquare = move.startSquare + 1;
            } else {
               // Queenside castle
               rookStartSquare = move.startSquare - 4;
               rookTargetSquare = move.startSquare - 1;
            }
   
            // Move the rook behind the king
            const rook = this.squares[rookStartSquare]!;
            rook.square = rookTargetSquare;
            this.squares[rookStartSquare] = null;
            this.squares[rookTargetSquare] = rook;
   
            break;
         }
      }
   
      movingPiece.square = move.targetSquare;
   
      // Recalculate attacked squares
      this.attackedSquares[movingPiece.colour] = Board.calculateAttackedSquares(this, movingPiece.colour);
   }

   unmakeMove(move: Move, castlingRightsBeforeMove: number): void {
      const movedPiece = this.squares[move.targetSquare]!

      if (movedPiece.type === PieceTypes.Pawn && Math.floor(move.targetSquare / 8) === 0) {
         console.log(move);
         console.log(this.squares.slice());
      }

      // If the piece is a king or a rook, remove the possibility to castle
      if (movedPiece.type === PieceTypes.King || movedPiece.type === PieceTypes.Rook) {
         this.updateCastlingRights(move, "unmake", castlingRightsBeforeMove);
      }

      const opposingColour = +!movedPiece.colour;
      const capturedPiece = this.lastCapturedPiece[opposingColour];

      // Move the piece from its current position to its previous one
      this.squares[move.startSquare] = movedPiece;
      this.squares[move.targetSquare] = capturedPiece;
   
      switch (move.flags) {
         case MoveFlags.IsCastling: {
            // Undo castling

            let rookStartSquare!: number;
            let rookTargetSquare!: number;
   
            if (move.targetSquare % 8 === 6) {
               // Kingside castle
               rookStartSquare = move.startSquare + 1;
               rookTargetSquare = move.startSquare + 3;
            } else {
               // Queenside castle
               rookStartSquare = move.startSquare - 1;
               rookTargetSquare = move.startSquare - 4;
            }
   
            // Move the rook back
            const rook = this.squares[rookStartSquare]!;
            rook.square = rookTargetSquare;
            this.squares[rookStartSquare] = null;
            this.squares[rookTargetSquare] = rook;
   
            break;
         }
      }
   
      movedPiece.square = move.startSquare;
   
      // Recalculate attacked squares
      this.attackedSquares[movedPiece.colour] = Board.calculateAttackedSquares(this, movedPiece.colour);
   }

   /**
    * Checks if a player has been checkmated
    * @param colour The colour of the player who will be checked if they are checkmated
    */
   public isCheckmate(colour: PlayerColours): boolean {
      let kingSquare!: number;
      for (let square = 0; square < 64; square++) {
         const piece = this.squares[square];

         if (piece !== null && piece.type === PieceTypes.King && piece.colour === colour) {
            kingSquare = square;
            break;
         }
      }
      if (typeof kingSquare === "undefined") {
         throw new Error("No king!");
      }

      const opponentResponses: Array<Move> = generateLegalMoves(this, colour);
      return opponentResponses.length === 0;
   }
}

export default Board; 