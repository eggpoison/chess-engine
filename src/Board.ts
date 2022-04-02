import { generateLegalMoves, generatePieceMoves, getSlidingPiecesRevealedByMove, PlayerColours } from "./computer-ai";
import Move, { getPromotionFlags, MoveFlags } from "./Move";
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

type PieceArray = {
   [key in PlayerColours]: {
      [key in PieceTypes]: Array<Piece>;
   };
};

class Board {
   public squares: Array<Piece | null>;

   public pieces: PieceArray;

   public squaresBeingAttackedBy: [AttackedSquares, AttackedSquares] = [[], []];

   public currentPlayer: PlayerColours;
   public castlingRights: number;

   // Stores the last captured piece of each colour
   // So the white lastCapturedPiece stores the last captured white piece
   public lastCapturedPiece: [Piece | null, Piece | null] = [null, null];

   constructor(squares: Array<Piece | null>, currentPlayer: PlayerColours, castlingRights: number) {
      this.squares = squares;
      this.pieces = this.getPiecesFromSquares();
      this.currentPlayer = currentPlayer;
      this.castlingRights = castlingRights;

      this.calculateAttackedSquares(PlayerColours.White);
      this.calculateAttackedSquares(PlayerColours.Black);
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
    * @param colour The colour of the attacked squares
    */
   private calculateAttackedSquares(colour: PlayerColours): void {
      const attackedSquares: AttackedSquares = {};

      for (let i = 0; i < 6; i++) {
         const pieceType = i as PieceTypes;

         const pieces = this.pieces[colour][pieceType];

         for (const piece of pieces) {
            const attackingMoves = generatePieceMoves(this, piece, true);
            
            for (const move of attackingMoves) {
               if (attackedSquares.hasOwnProperty(move.targetSquare)) {
                  attackedSquares[move.targetSquare].push(piece);
               } else {
                  attackedSquares[move.targetSquare] = [piece];
               }
            }

            piece.previousAttackedSquares = attackingMoves.map(move => move.targetSquare);
         }
      }

      this.squaresBeingAttackedBy[colour] = attackedSquares;
   }

   private recalculatePieceAttackedSquares(piece: Piece, a: Piece): void {
      const colour = piece.colour;

      // Remove previously attacked squares
      const previousAttackedSquares = piece.previousAttackedSquares;
      for (const square of previousAttackedSquares) {
         const attackedSquare = this.squaresBeingAttackedBy[colour][square];
         if (typeof attackedSquare === "undefined") {
            console.warn("Tried to remove piece from square", square, "but it didn't exist!");
            console.log(this.squaresBeingAttackedBy[colour]);
            console.log("Current squares:", this.squares.slice());
            console.log(piece);
            console.log(a);
         }
         attackedSquare.splice(attackedSquare.indexOf(piece), 1);

         if (attackedSquare.length === 0) {
            // console.log("Square " + square + " has been banned!");
            if (square === 58) {
               console.warn("Removed 58!");
               // console.log(this.squares.slice());
               // throw new Error("U");
            }
            delete this.squaresBeingAttackedBy[colour][square];
         }
      }

      // Generate new attacked squares
      const squaresBeingAttacked = generatePieceMoves(this, piece, true).map(move => move.targetSquare);
      // console.log(piece.square, squaresBeingAttacked);

      for (const square of squaresBeingAttacked) {
         const isAlreadyAttacked = this.squaresBeingAttackedBy[colour].hasOwnProperty(square);

         if (isAlreadyAttacked && this.squaresBeingAttackedBy[colour][square].includes(piece)) continue;

         if (!isAlreadyAttacked) {
            this.squaresBeingAttackedBy[colour][square] = new Array<Piece>();
            if (square === 58) {
               console.warn("58 is back");
            }
         }
         this.squaresBeingAttackedBy[colour][square].push(piece);
         if (this.squaresBeingAttackedBy[colour][square].length === 0) {
            throw new Error("E");
         }
      }

      // Update the previously attacked squares
      piece.previousAttackedSquares = squaresBeingAttacked;
   }

   private recalculateAttackedSquares(move: Move, type: "make" | "undo", previouslyAttackedSquares: Array<number>, newAttackedSquares: Array<number>): void {
      // Problem: when a piece is moved, any sliding pieces which had been blocked by the piece but are revealed
      // don't get accounted for

      const piece = type === "make" ? this.squares[move.targetSquare]! : this.squares[move.startSquare]!;
      const colour = piece.colour;

      const squaresInCommon = new Array<number>();

      const filteredPreviouslyAttackedSquares = new Array<number>();
      const filteredNewAttackedSquares = new Array<number>();

      for (const square of previouslyAttackedSquares) {
         if (newAttackedSquares.includes(square)) {
            squaresInCommon.push(square);
         } else {
            filteredPreviouslyAttackedSquares.push(square);
         }
      }

      for (const square of newAttackedSquares) {
         if (!squaresInCommon.includes(square)) {
            filteredNewAttackedSquares.push(square);
         }
      }

      // Remove previously attacked squares
      for (const square of previouslyAttackedSquares) {
         const attackedArray = this.squaresBeingAttackedBy[colour][square];
         if (typeof attackedArray === "undefined") {
            // console.warn("cring!");
            // console.log(square, piece);
            // console.log(this.squaresBeingAttackedBy[colour]);
            // console.log(filteredPreviouslyAttackedSquares, filteredNewAttackedSquares);
         }
         attackedArray.splice(attackedArray.indexOf(piece), 1);

         if (attackedArray.length === 0) {
            if (square === 58) {
               console.warn("hes gone again");
               // console.log(this.squares.slice());
               // console.log(piece);
            }
            delete this.squaresBeingAttackedBy[colour][square];
         }
      }

      // Add new attacked squares
      for (const square of newAttackedSquares) {
         if (!this.squaresBeingAttackedBy[colour].hasOwnProperty(square)) {
            this.squaresBeingAttackedBy[colour][square] = new Array<Piece>();
         }
         this.squaresBeingAttackedBy[colour][square].push(piece);
      }

      // If moving the piece from its starting position allows any sliding pieces to move, account for those new moves
      const piecesRevealedAtStart = getSlidingPiecesRevealedByMove(this, move.startSquare);
      const piecesRevealedAtEnd = getSlidingPiecesRevealedByMove(this, move.targetSquare);
      const piecesRevealed = [ ...piecesRevealedAtStart, ...piecesRevealedAtEnd ];

      for (const pieceRevealed of piecesRevealed) {
         // Don't recalculate if the piece is the piece which has moved!
         if (pieceRevealed === piece) continue;

         this.recalculatePieceAttackedSquares(pieceRevealed, piece);
      }
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

      // Used when recalculating attacked squares
      const previouslyAttackedSquares = generatePieceMoves(this, movingPiece, true).map(move => move.targetSquare);
      // if (move.targetSquare === 51 && movingPiece.type === PieceTypes.Bishop) {
      //    console.log(movingPiece.square);
      //    console.log(this.squares.slice());
      //    console.log(previouslyAttackedSquares);
      // }

      // If the piece is a king or a rook, remove the possibility to castle
      if (movingPiece.type === PieceTypes.King || movingPiece.type === PieceTypes.Rook) {
         this.updateCastlingRights(move, "make");
      }

      // Update the captured piece
      const opposingColour = movingPiece.colour ? 0 : 1;
      const targetPiece = this.squares[move.targetSquare];
      // Remove the captured piece from the piece array
      if (targetPiece !== null) {
         const pieceArray = this.pieces[targetPiece.colour][targetPiece.type];
         pieceArray.splice(pieceArray.indexOf(targetPiece), 1);
      }
      this.lastCapturedPiece[opposingColour] = targetPiece;

      // Move the piece from its previous position to its new one
      this.squares[move.startSquare] = null;
      this.squares[move.targetSquare] = movingPiece;
      movingPiece.square = move.targetSquare;

      const isCastling = move.flags === MoveFlags.IsCastling;
      const isPromoting = getPromotionFlags().includes(move.flags);

      if (isCastling) {
         // Castling
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
      } else if (isPromoting) {
         // Change the pawn to its promoted piece type
         switch (move.flags) {
            case MoveFlags.IsQueenPromotion: {
               movingPiece.type = PieceTypes.Queen;
               break;
            }
            case MoveFlags.IsRookPromotion: {
               movingPiece.type = PieceTypes.Rook;
               break;
            }
            case MoveFlags.IsKnightPromotion: {
               movingPiece.type = PieceTypes.Knight;
               break;
            }
            case MoveFlags.IsBishopPromotion: {
               movingPiece.type = PieceTypes.Bishop;
               break;
            }
         }
      }
      
      const newAttackedSquares = generatePieceMoves(this, movingPiece, true).map(move => move.targetSquare);
      if (move.targetSquare === 51 && movingPiece.type === PieceTypes.Bishop) {
         // console.log(movingPiece, previouslyAttackedSquares);
      }
      this.recalculateAttackedSquares(move, "make", previouslyAttackedSquares, newAttackedSquares);
   }

   undoMove(move: Move, castlingRightsBeforeMove: number): void {
      const movedPiece = this.squares[move.targetSquare]!

      // Used when recalculating attacked squares
      const previouslyAttackedSquares = generatePieceMoves(this, movedPiece, true).map(move => move.targetSquare);
      // console.log(previouslyAttackedSquares);

      // If the piece is a king or a rook, remove the possibility to castle
      if (movedPiece.type === PieceTypes.King || movedPiece.type === PieceTypes.Rook) {
         this.updateCastlingRights(move, "unmake", castlingRightsBeforeMove);
      }

      // Update the captured piece
      // const opposingColour = movingPiece.colour ? 0 : 1;
      // const targetPiece = this.squares[move.targetSquare];
      // this.lastCapturedPiece[opposingColour] = targetPiece;

      const capturedColour = movedPiece.colour ? 0 : 1;
      const capturedPiece = this.lastCapturedPiece[capturedColour];
      // Add the captured piece back to the piece array
      if (capturedPiece !== null) {
         const pieceArray = this.pieces[capturedPiece.colour][capturedPiece.type];
         pieceArray.push(capturedPiece);
      }

      // Move the piece from its current position to its previous one
      this.squares[move.startSquare] = movedPiece;
      this.squares[move.targetSquare] = capturedPiece;
      movedPiece.square = move.startSquare;

      const isCastling = move.flags === MoveFlags.IsCastling;
      const isPromoting = getPromotionFlags().includes(move.flags);

      if (isCastling) {
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
      } else if (isPromoting) {
         // Revert the piece to a pawn
         movedPiece.type = PieceTypes.Pawn;
      }
      
      const newAttackedSquares = generatePieceMoves(this, movedPiece, true).map(move => move.targetSquare);
      // console.log(newAttackedSquares);
      this.recalculateAttackedSquares(move, "undo", previouslyAttackedSquares, newAttackedSquares);
      // console.log("Undo move, recalculate:", this.squaresBeingAttackedBy[movedPiece.colour]);
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

   public addPieceAtSquare(piece: Piece, square: number): void {
      if (this.squares[square] !== null) {
         console.log(piece, square);
         console.log(this.squares.slice());
         throw new Error("Tried to add a piece in a square where there was already a piece!");
      }

      this.squares[square] = piece;
   }

   public removePieceAtSquare(square: number): void {
      this.squares[square] = null;
   }

   private getPiecesFromSquares(): PieceArray {
      // Initialise the piecearray
      const pieces: PieceArray = {
         [PlayerColours.White]: {
            [PieceTypes.Queen]: new Array<Piece>(),
            [PieceTypes.King]: new Array<Piece>(),
            [PieceTypes.Rook]: new Array<Piece>(),
            [PieceTypes.Knight]: new Array<Piece>(),
            [PieceTypes.Bishop]: new Array<Piece>(),
            [PieceTypes.Pawn]: new Array<Piece>(),
         },
         [PlayerColours.Black]: {
            [PieceTypes.Queen]: new Array<Piece>(),
            [PieceTypes.King]: new Array<Piece>(),
            [PieceTypes.Rook]: new Array<Piece>(),
            [PieceTypes.Knight]: new Array<Piece>(),
            [PieceTypes.Bishop]: new Array<Piece>(),
            [PieceTypes.Pawn]: new Array<Piece>(),
         }
      };

      for (const piece of this.squares) {
         if (piece !== null) {
            pieces[piece.colour][piece.type].push(piece);
         }
      }

      return pieces;
   }
}

export default Board;