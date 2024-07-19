const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");

                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                pieceElement.addEventListener("click", () => {
                    highlightMoves(rowIndex, squareIndex);
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const sourceSquare = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
    const targetSquare = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;

    const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Promote to a queen if a pawn reaches the end
    };

    const result = chess.move(move);

    if (result) {
        renderBoard();
        socket.emit('move', move); // Emit the move to the server if using Socket.IO for multiplayer
    } else {
        console.log('Invalid move');
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔"
    };
    return unicodePieces[piece.type] || "";
};

const highlightMoves = (row, col) => {
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    const moves = chess.moves({ square, verbose: true });

    clearHighlights();

    moves.forEach(move => {
        const targetRow = 8 - parseInt(move.to[1]);
        const targetCol = move.to.charCodeAt(0) - 97;

        const targetSquare = document.querySelector(`.square[data-row='${targetRow}'][data-col='${targetCol}']`);
        targetSquare.classList.add("highlight");
    });
};

const clearHighlights = () => {
    const highlightedSquares = document.querySelectorAll(".highlight");
    highlightedSquares.forEach(square => {
        square.classList.remove("highlight");
    });
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

renderBoard();