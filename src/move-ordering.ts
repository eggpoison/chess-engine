import Board from "./Board";
import { getPieceValue } from "./evaluation";
import Move, { MoveFlags } from "./Move";
import { PieceTypes } from "./Piece";

const CAPTURED_PIECE_MULTIPLIER = 10;

const calculateMoveScores = (board: Board, moves: Array<Move>): Array<number> => {
    const moveScores = new Array<number>();

    for (let i = 0; i < moves.length; i++) {
        let score = 0;
        const move = moves[i];
        
        const movedPiece = board.squares[move.startSquare]!;
        const capturedPiece = board.squares[move.targetSquare];

        if (capturedPiece !== null) {
            // Reward capturing a high-value piece with a low-value piece
            // The CAPTURED_PIECE_MULTIPLIER variable is used to make even bad captures (Q takes P) rank above non-captures
            score = getPieceValue(capturedPiece.type) * CAPTURED_PIECE_MULTIPLIER - getPieceValue(movedPiece.type);
        }

        switch (move.flags) {
            case MoveFlags.IsQueenPromotion: {
                score += getPieceValue(PieceTypes.Queen);
                break;
            }
            case MoveFlags.IsRookPromotion: {
                score += getPieceValue(PieceTypes.Rook);
                break;
            }
            case MoveFlags.IsKnightPromotion: {
                score += getPieceValue(PieceTypes.Knight);
                break;
            }
            case MoveFlags.IsBishopPromotion: {
                score += getPieceValue(PieceTypes.Bishop);
                break;
            }
        }

        moveScores[i] = score;
    }

    return moveScores;
}

/** Uses bubble sort to sort the moves based on their score */
const sortMoves = (moves: Array<Move>, moveScores: Array<number>): Array<Move> => {
    const n = moves.length;

    const sortedMoves = moves.slice();
    const sortedMoveScores = moveScores.slice();

    for (let i = 0; i < n; i++) {
        for (let j = n - i - 1; j > 0; j--) {
            if (sortedMoveScores[j - 1] < sortedMoveScores[j]) {
                // Swap moves
                const temp = sortedMoves[j];
                sortedMoves[j] = sortedMoves[j - 1];
                sortedMoves[j - 1] = temp;

                // Swap move scores
                const temp2 = sortedMoveScores[j];
                sortedMoveScores[j] = sortedMoveScores[j - 1];
                sortedMoveScores[j - 1] = temp2;
            }
        }
    }

    return sortedMoves;
}

export function orderMoves(board: Board, moves: Array<Move>): Array<Move> {
    const moveScores: Array<number> = calculateMoveScores(board, moves);
    const sortedMoves: Array<Move> = sortMoves(moves, moveScores);
    return sortedMoves;
}