import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../constants/colors";

const SIZE = 4;
type Grid = (number | null)[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: "#1A1A2E", text: "#E0E0FF" },
  4: { bg: "#16213E", text: "#E0E0FF" },
  8: { bg: "#FF8C42", text: "#fff" },
  16: { bg: "#FF6B35", text: "#fff" },
  32: { bg: "#FF4757", text: "#fff" },
  64: { bg: "#FF2D55", text: "#fff" },
  128: { bg: "#FFD700", text: "#fff" },
  256: { bg: "#FFA500", text: "#fff" },
  512: { bg: "#00D9FF", text: "#fff" },
  1024: { bg: "#6C63FF", text: "#fff" },
  2048: { bg: "#00FF9F", text: "#000" },
};

function newGrid(): Grid {
  const g: Grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  addRandom(g);
  addRandom(g);
  return g;
}

function addRandom(g: Grid) {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!g[r][c]) empty.push([r, c]);
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function slideRow(row: (number | null)[]): { row: (number | null)[]; score: number } {
  const nums = row.filter(Boolean) as number[];
  let score = 0;
  const merged: (number | null)[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const val = nums[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(nums[i]);
      i++;
    }
  }
  while (merged.length < SIZE) merged.push(null);
  return { row: merged, score };
}

function move(g: Grid, dir: "left" | "right" | "up" | "down"): { grid: Grid; score: number; moved: boolean } {
  let grid: Grid = g.map((r) => [...r]);
  let totalScore = 0;
  let moved = false;

  if (dir === "left") {
    for (let r = 0; r < SIZE; r++) {
      const { row, score } = slideRow(grid[r]);
      if (JSON.stringify(row) !== JSON.stringify(grid[r])) moved = true;
      grid[r] = row;
      totalScore += score;
    }
  } else if (dir === "right") {
    for (let r = 0; r < SIZE; r++) {
      const rev = [...grid[r]].reverse();
      const { row, score } = slideRow(rev);
      const result = row.reverse();
      if (JSON.stringify(result) !== JSON.stringify(grid[r])) moved = true;
      grid[r] = result;
      totalScore += score;
    }
  } else if (dir === "up") {
    for (let c = 0; c < SIZE; c++) {
      const col = grid.map((r) => r[c]);
      const { row, score } = slideRow(col);
      if (JSON.stringify(row) !== JSON.stringify(col)) moved = true;
      for (let r = 0; r < SIZE; r++) grid[r][c] = row[r];
      totalScore += score;
    }
  } else {
    for (let c = 0; c < SIZE; c++) {
      const col = grid.map((r) => r[c]).reverse();
      const { row, score } = slideRow(col);
      const result = row.reverse();
      if (JSON.stringify(result) !== JSON.stringify(grid.map((r) => r[c]))) moved = true;
      for (let r = 0; r < SIZE; r++) grid[r][c] = result[r];
      totalScore += score;
    }
  }
  return { grid, score: totalScore, moved };
}

function hasWon(g: Grid): boolean {
  return g.some((r) => r.some((c) => c === 2048));
}

function hasLost(g: Grid): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (!g[r][c]) return false;
      if (c + 1 < SIZE && g[r][c] === g[r][c + 1]) return false;
      if (r + 1 < SIZE && g[r][c] === g[r + 1][c]) return false;
    }
  return true;
}

const { width } = Dimensions.get("window");
const BOARD_PAD = 16;
const GAP = 8;
const TILE_SIZE = (width - BOARD_PAD * 2 - GAP * (SIZE + 1)) / SIZE;

export default function Game2048() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [grid, setGrid] = useState<Grid>(newGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const gridRef = useRef(grid);
  const scoreRef = useRef(0);

  gridRef.current = grid;
  scoreRef.current = score;

  useEffect(() => {
    AsyncStorage.getItem("best_score_2048").then((v: string | null) => {
      if (v) setBestScore(parseInt(v));
    });
  }, []);

  const handleMove = useCallback(
    async (dir: "left" | "right" | "up" | "down") => {
      if (gameState !== "playing") return;
      const { grid: newG, score: gained, moved } = move(gridRef.current, dir);
      if (!moved) return;
      addRandom(newG);
      const newScore = scoreRef.current + gained;
      setGrid(newG);
      setScore(newScore);
      scoreRef.current = newScore;
      Haptics.selectionAsync();

      if (newScore > bestScore) {
        setBestScore(newScore);
        await AsyncStorage.setItem("best_score_2048", String(newScore));
      }
      if (hasWon(newG)) setGameState("won");
      else if (hasLost(newG)) setGameState("lost");
    },
    [gameState, bestScore]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_: any, g: any) => {
        const { dx, dy } = g;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < 20) return;
        if (absDx > absDy) {
          handleMove(dx > 0 ? "right" : "left");
        } else {
          handleMove(dy > 0 ? "down" : "up");
        }
      },
    })
  ).current;

  const resetGame = () => {
    setGrid(newGrid());
    setScore(0);
    setGameState("playing");
  };

  const getTileColor = (val: number | null) => {
    if (!val) return Colors.dark.surface;
    return TILE_COLORS[val]?.bg ?? "#6C63FF";
  };

  const getTileTextColor = (val: number) => {
    return TILE_COLORS[val]?.text ?? "#fff";
  };

  const getTileFontSize = (val: number) => {
    if (val >= 1024) return 20;
    if (val >= 128) return 24;
    return 28;
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.gameTitle}>2048</Text>
        <View style={styles.scores}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>BEST</Text>
            <Text style={[styles.scoreValue, { color: Colors.dark.accentGold }]}>{bestScore}</Text>
          </View>
        </View>
      </View>

      <View style={styles.boardWrap} {...panResponder.panHandlers}>
        <View style={[styles.board, { width: width - BOARD_PAD * 2, padding: GAP, gap: GAP }]}>
          {grid.map((row: (number | null)[], r: number) => (
            <View key={r} style={[styles.row, { gap: GAP }]}>
              {row.map((val: number | null, c: number) => (
                <View
                  key={c}
                  style={[
                    styles.tile,
                    {
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      backgroundColor: getTileColor(val),
                      borderWidth: val ? 0 : 1,
                    },
                  ]}
                >
                  {val ? (
                    <Text
                      style={[
                        styles.tileText,
                        {
                          color: getTileTextColor(val),
                          fontSize: getTileFontSize(val),
                        },
                      ]}
                    >
                      {val}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}

          {gameState !== "playing" && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>
                {gameState === "won" ? "You Won!" : "Game Over"}
              </Text>
              <Text style={styles.overlayScore}>Score: {score}</Text>
              <Pressable style={styles.overlayBtn} onPress={resetGame}>
                <Text style={styles.overlayBtnText}>Play Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.arrowRow}>
          <Pressable style={styles.arrowBtn} onPress={() => handleMove("up")}>
            <Ionicons name="chevron-up" size={22} color={Colors.dark.text} />
          </Pressable>
        </View>
        <View style={styles.arrowRow}>
          <Pressable style={styles.arrowBtn} onPress={() => handleMove("left")}>
            <Ionicons name="chevron-back" size={22} color={Colors.dark.text} />
          </Pressable>
          <Pressable style={[styles.arrowBtn, { backgroundColor: Colors.dark.tint + "30", borderColor: Colors.dark.tint }]} onPress={resetGame}>
            <Ionicons name="refresh" size={20} color={Colors.dark.tint} />
          </Pressable>
          <Pressable style={styles.arrowBtn} onPress={() => handleMove("right")}>
            <Ionicons name="chevron-forward" size={22} color={Colors.dark.text} />
          </Pressable>
        </View>
        <View style={styles.arrowRow}>
          <Pressable style={styles.arrowBtn} onPress={() => handleMove("down")}>
            <Ionicons name="chevron-down" size={22} color={Colors.dark.text} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.hint}>Swipe or use arrows to move tiles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background, alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, alignItems: "center", justifyContent: "center" },
  gameTitle: { flex: 1, textAlign: "center", fontSize: 24, color: Colors.dark.accentGold, fontFamily: "Inter_700Bold" },
  scores: { flexDirection: "row", gap: 12 },
  scoreBox: { alignItems: "center", backgroundColor: Colors.dark.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.dark.border },
  scoreLabel: { fontSize: 9, color: Colors.dark.textMuted, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  scoreValue: { fontSize: 18, color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  boardWrap: { marginVertical: 16 },
  board: { borderRadius: 16, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, position: "relative" },
  row: { flexDirection: "row" },
  tile: { borderRadius: 10, alignItems: "center", justifyContent: "center", borderColor: Colors.dark.border },
  tileText: { fontFamily: "Inter_700Bold" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,10,15,0.88)", alignItems: "center", justifyContent: "center", gap: 16, borderRadius: 16 },
  overlayTitle: { fontSize: 36, color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  overlayScore: { fontSize: 22, color: Colors.dark.accentGold, fontFamily: "Inter_600SemiBold" },
  overlayBtn: { backgroundColor: Colors.dark.tint, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  overlayBtnText: { fontSize: 16, color: "#fff", fontFamily: "Inter_700Bold" },
  controls: { marginTop: 8, alignItems: "center", gap: 4 },
  arrowRow: { flexDirection: "row", gap: 4 },
  arrowBtn: { width: 54, height: 54, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hint: { marginTop: 12, fontSize: 12, color: Colors.dark.textMuted, fontFamily: "Inter_400Regular" },
});
