import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from "../../constants/colors";

const { width } = Dimensions.get('window');
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = Math.floor((width - 100) / COLS);

// הגדרת הצורות בצורה מטריציונית מקצועית
const TETROMINOS = {
    I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: Colors.dark.neonCyan },
    J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: Colors.dark.neonPurple },
    L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: Colors.dark.neonOrange },
    O: { shape: [[1, 1], [1, 1]], color: Colors.dark.accentGold },
    S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: Colors.dark.accentGreen },
    T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: Colors.dark.neonPink },
    Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: Colors.dark.accentWarm }
};

export default function TetrisPro() {
    const router = useRouter();
    const [grid, setGrid] = useState(Array(ROWS).fill(0).map(() => Array(COLS).fill(null)));
    const [activePiece, setActivePiece] = useState<any>(null);
    const [nextPiece, setNextPiece] = useState<any>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");

    const gameInterval = useRef<any>(null);

    // פונקציית עזר ליצירת קוביה רנדומלית
    const getRandomPiece = useCallback(() => {
        const keys = Object.keys(TETROMINOS);
        const type = keys[Math.floor(Math.random() * keys.length)];
        return {
            pos: { x: 3, y: 0 },
            //@ts-ignore
            shape: TETROMINOS[type].shape,
            //@ts-ignore
            color: TETROMINOS[type].color
        };
    }, []);

    const checkCollision = (x: number, y: number, shape: number[][], currentGrid: any) => {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    if (y + r >= ROWS || x + c < 0 || x + c >= COLS || (currentGrid[y + r] && currentGrid[y + r][x + c] !== null)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const spawnPiece = useCallback((currentGrid: any) => {
        const newPiece = nextPiece || getRandomPiece();
        const next = getRandomPiece();
        setNextPiece(next);

        if (checkCollision(newPiece.pos.x, newPiece.pos.y, newPiece.shape, currentGrid)) {
            setGameState("over");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
            setActivePiece(newPiece);
        }
    }, [nextPiece, getRandomPiece]);

    const rotate = () => {
        if (!activePiece || gameState !== "playing") return;
        const rotated = activePiece.shape[0].map((_: any, index: number) => activePiece.shape.map((col: any) => col[index]).reverse());

        // Wall Kick - ניסיון להזיז ימינה/שמאלה אם הסיבוב תקוע בקיר
        let offset = 0;
        if (checkCollision(activePiece.pos.x, activePiece.pos.y, rotated, grid)) {
            offset = activePiece.pos.x > COLS / 2 ? -1 : 1;
            if (checkCollision(activePiece.pos.x + offset, activePiece.pos.y, rotated, grid)) return;
        }

        setActivePiece({ ...activePiece, shape: rotated, pos: { ...activePiece.pos, x: activePiece.pos.x + offset } });
        Haptics.selectionAsync();
    };

    const lockPiece = () => {
        if (!activePiece) return;
        const newGrid = grid.map(row => [...row]);
        activePiece.shape.forEach((row: any, r: number) => {
            row.forEach((value: number, c: number) => {
                if (value !== 0) {
                    if (activePiece.pos.y + r >= 0) newGrid[activePiece.pos.y + r][activePiece.pos.x + c] = activePiece.color;
                }
            });
        });

        // בדיקת שורות מלאות
        let linesCleared = 0;
        const filteredGrid = newGrid.filter(row => {
            if (row.every(cell => cell !== null)) {
                linesCleared++;
                return false;
            }
            return true;
        });

        while (filteredGrid.length < ROWS) filteredGrid.unshift(Array(COLS).fill(null));

        if (linesCleared > 0) {
            setScore(s => s + (linesCleared * 100 * level));
            if (linesCleared === 4) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        setGrid(filteredGrid);
        spawnPiece(filteredGrid);
    };

    const move = (dx: number, dy: number) => {
        if (!activePiece || gameState !== "playing") return;
        if (!checkCollision(activePiece.pos.x + dx, activePiece.pos.y + dy, activePiece.shape, grid)) {
            setActivePiece({ ...activePiece, pos: { x: activePiece.pos.x + dx, y: activePiece.pos.y + dy } });
        } else if (dy > 0) {
            lockPiece();
        }
    };

    const hardDrop = () => {
        if (!activePiece || gameState !== "playing") return;
        let dropY = activePiece.pos.y;
        while (!checkCollision(activePiece.pos.x, dropY + 1, activePiece.shape, grid)) dropY++;
        setActivePiece({ ...activePiece, pos: { ...activePiece.pos, y: dropY } });
        setTimeout(lockPiece, 50);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    useEffect(() => {
        if (gameState === "playing") {
            const speed = Math.max(100, 800 - (level - 1) * 100);
            gameInterval.current = setInterval(() => move(0, 1), speed);
            return () => clearInterval(gameInterval.current);
        }
    }, [gameState, activePiece, level]);

    const startGame = () => {
        setGrid(Array(ROWS).fill(0).map(() => Array(COLS).fill(null)));
        setScore(0);
        setLevel(1);
        setGameState("playing");
        setNextPiece(getRandomPiece());
        spawnPiece(Array(ROWS).fill(0).map(() => Array(COLS).fill(null)));
    };

    // חישוב ה-Ghost Piece (הצל)
    const getGhostY = () => {
        if (!activePiece) return 0;
        let ghostY = activePiece.pos.y;
        while (!checkCollision(activePiece.pos.x, ghostY + 1, activePiece.shape, grid)) ghostY++;
        return ghostY;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="close" size={24} color="white" /></Pressable>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>LEVEL {level}</Text>
                    <Text style={styles.scoreValue}>{score}</Text>
                </View>
                <View style={styles.nextContainer}>
                    <Text style={styles.nextLabel}>NEXT</Text>
                    {nextPiece && <View style={styles.miniGrid}>
                        {nextPiece.shape.map((row: any, i: number) => (
                            <View key={i} style={{ flexDirection: 'row' }}>
                                {row.map((cell: number, j: number) => (
                                    <View key={j} style={[styles.miniCell, { backgroundColor: cell ? nextPiece.color : 'transparent' }]} />
                                ))}
                            </View>
                        ))}
                    </View>}
                </View>
            </View>

            <View style={styles.board}>
                {grid.map((row, r) => (
                    <View key={r} style={styles.row}>
                        {row.map((cell, c) => {
                            let color = cell;
                            let opacity = 1;

                            // Ghost Piece logic
                            const ghostY = getGhostY();
                            if (activePiece) {
                                const { pos, shape, color: pColor } = activePiece;
                                if (r >= pos.y && r < pos.y + shape.length && c >= pos.x && c < pos.x + shape[0].length && shape[r - pos.y][c - pos.x]) {
                                    color = pColor;
                                } else if (r >= ghostY && r < ghostY + shape.length && c >= pos.x && c < pos.x + shape[0].length && shape[r - ghostY][c - pos.x]) {
                                    color = pColor;
                                    opacity = 0.2;
                                }
                            }

                            return (
                                <View key={c} style={[styles.cell, { backgroundColor: color ? '#12121A' : '#0A0A0F', opacity }]}>
                                    {color && (
                                        <View style={[styles.block, { backgroundColor: color }]}>
                                            <View style={styles.blockInner} />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
                {gameState !== "playing" && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayTitle}>{gameState === "over" ? "GAME OVER" : "ARCADE TETRIS"}</Text>
                        <Pressable style={styles.startBtn} onPress={startGame}>
                            <Text style={styles.startBtnText}>{gameState === "over" ? "TRY AGAIN" : "START ENGINE"}</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            <View style={styles.controls}>
                <View style={styles.controlRow}>
                    <Pressable style={styles.ctrlBtn} onPress={() => move(-1, 0)}><Ionicons name="chevron-back" size={30} color="white" /></Pressable>
                    <Pressable style={[styles.ctrlBtn, { backgroundColor: Colors.dark.neonCyan }]} onPress={rotate}><Ionicons name="refresh" size={30} color="black" /></Pressable>
                    <Pressable style={styles.ctrlBtn} onPress={() => move(1, 0)}><Ionicons name="chevron-forward" size={30} color="white" /></Pressable>
                </View>
                <View style={styles.controlRow}>
                    <Pressable style={[styles.ctrlBtn, styles.hardDropBtn]} onPress={hardDrop}>
                        <Text style={styles.hardDropText}>HARD DROP</Text>
                    </Pressable>
                    <Pressable style={styles.ctrlBtn} onPress={() => move(0, 1)}><Ionicons name="chevron-down" size={30} color="white" /></Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#050505", alignItems: "center", paddingTop: 40 },
    header: { width: "100%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 10 },
    backBtn: { width: 40, height: 40, backgroundColor: "#12121A", borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#2A2A3F" },
    scoreContainer: { alignItems: 'center' },
    scoreLabel: { color: Colors.dark.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
    scoreValue: { color: Colors.dark.accentGreen, fontSize: 28, fontWeight: '900' },
    nextContainer: { width: 60, alignItems: 'center' },
    nextLabel: { color: Colors.dark.textMuted, fontSize: 8, marginBottom: 5 },
    miniGrid: { padding: 5, backgroundColor: '#12121A', borderRadius: 5 },
    miniCell: { width: 8, height: 8, margin: 1, borderRadius: 1 },
    board: { borderWidth: 3, borderColor: "#1A1A26", backgroundColor: "#0A0A0F", overflow: 'hidden', borderRadius: 4 },
    row: { flexDirection: "row" },
    cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: "#111", justifyContent: 'center', alignItems: 'center' },
    block: { width: CELL_SIZE - 4, height: CELL_SIZE - 4, borderRadius: 4, padding: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2, elevation: 5 },
    blockInner: { flex: 1, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderLeftWidth: 1, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", zIndex: 10 },
    overlayTitle: { color: "white", fontSize: 36, fontWeight: "900", marginBottom: 20, letterSpacing: 4, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
    startBtn: { backgroundColor: Colors.dark.accentGreen, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, shadowColor: Colors.dark.accentGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
    startBtnText: { color: "black", fontWeight: "900", fontSize: 18, letterSpacing: 1 },
    controls: { marginTop: 30, gap: 15 },
    controlRow: { flexDirection: 'row', gap: 20, justifyContent: 'center' },
    ctrlBtn: { width: 70, height: 70, backgroundColor: "#1A1A26", borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#333", elevation: 4 },
    hardDropBtn: { width: 160, backgroundColor: "#252535", borderColor: Colors.dark.neonCyan },
    hardDropText: { color: Colors.dark.neonCyan, fontWeight: '900', fontSize: 13, letterSpacing: 1 }
});