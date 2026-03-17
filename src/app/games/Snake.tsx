import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../constants/colors";

const { width } = Dimensions.get("window");
const COLS = 20;
const ROWS = 20;
const CELL_SIZE = Math.floor((width - 32) / COLS);
const BOARD_SIZE = CELL_SIZE * COLS;

type Point = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

const TICK_SPEED = 130;

function randomPoint(snake: Point[]): Point {
  let pt: Point;
  do {
    pt = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === pt.x && s.y === pt.y));
  return pt;
}

export default function SnakeGame() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");
  const dirRef = useRef<Direction>("RIGHT");
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eatAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem("best_score_snake").then((v: string | null) => {
      if (v) setBestScore(parseInt(v));
    });
  }, []);

  snakeRef.current = snake;
  foodRef.current = food;
  scoreRef.current = score;

  const endGame = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setGameState("over");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const stored = await AsyncStorage.getItem("best_score_snake");
    const prev = stored ? parseInt(stored) : 0;
    if (scoreRef.current > prev) {
      await AsyncStorage.setItem("best_score_snake", String(scoreRef.current));
      setBestScore(scoreRef.current);
    }
  }, []);

  const tick = useCallback(() => {
    const dir = dirRef.current;
    const s = [...snakeRef.current];
    const head = { ...s[0] };

    if (dir === "UP") head.y -= 1;
    if (dir === "DOWN") head.y += 1;
    if (dir === "LEFT") head.x -= 1;
    if (dir === "RIGHT") head.x += 1;

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endGame();
      return;
    }
    if (s.some((p) => p.x === head.x && p.y === head.y)) {
      endGame();
      return;
    }

    const newSnake = [head, ...s];
    const ate = head.x === foodRef.current.x && head.y === foodRef.current.y;
    if (!ate) {
      newSnake.pop();
    } else {
      const newScore = scoreRef.current + 10;
      setScore(newScore);
      scoreRef.current = newScore;
      setFood(randomPoint(newSnake));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(eatAnim, { toValue: 1.3, duration: 80, useNativeDriver: true }),
        Animated.timing(eatAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
    setSnake(newSnake);
  }, [endGame]);

  const startGame = () => {
    const initialSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    setSnake(initialSnake);
    setFood({ x: 15, y: 10 });
    dirRef.current = "RIGHT";
    setDirection("RIGHT");
    setScore(0);
    setGameState("playing");
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, TICK_SPEED);
  };

  useEffect(() => {
    if (gameState === "playing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, TICK_SPEED);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, tick]);

  const changeDir = (d: Direction) => {
    const cur = dirRef.current;
    if (
      (d === "UP" && cur === "DOWN") ||
      (d === "DOWN" && cur === "UP") ||
      (d === "LEFT" && cur === "RIGHT") ||
      (d === "RIGHT" && cur === "LEFT")
    )
      return;
    dirRef.current = d;
    setDirection(d);
  };

  const cellStyle = (x: number, y: number) => {
    const isHead = snake[0]?.x === x && snake[0]?.y === y;
    const isBody = snake.some((s: Point, i: number) => i > 0 && s.x === x && s.y === y);
    const isFood = food.x === x && food.y === y;
    if (isHead) return { ...styles.cell, backgroundColor: Colors.dark.accentGreen };
    if (isBody) return { ...styles.cell, backgroundColor: Colors.dark.accentGreen + "80" };
    if (isFood) return { ...styles.cell, backgroundColor: Colors.dark.accentWarm };
    return styles.cell;
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => { if (intervalRef.current) clearInterval(intervalRef.current); router.back(); }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.gameTitle}>Snake</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      <View style={styles.bestRow}>
        <Ionicons name="trophy" size={14} color={Colors.dark.accentGold} />
        <Text style={styles.bestText}>Best: {bestScore}</Text>
      </View>

      <View style={styles.boardContainer}>
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
          {Array.from({ length: ROWS }).map((_, y) => (
            <View key={y} style={styles.row}>
              {Array.from({ length: COLS }).map((_, x) => (
                <View key={x} style={cellStyle(x, y)} />
              ))}
            </View>
          ))}
          {(gameState === "idle" || gameState === "over") && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>
                {gameState === "over" ? "Game Over" : "Snake"}
              </Text>
              {gameState === "over" && (
                <Text style={styles.overlayScore}>Score: {score}</Text>
              )}
              <Pressable style={styles.overlayBtn} onPress={startGame}>
                <Text style={styles.overlayBtnText}>
                  {gameState === "over" ? "Play Again" : "Start Game"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={styles.dpad}>
        <Pressable style={styles.dpadBtn} onPress={() => changeDir("UP")}>
          <Ionicons name="chevron-up" size={28} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.dpadRow}>
          <Pressable style={styles.dpadBtn} onPress={() => changeDir("LEFT")}>
            <Ionicons name="chevron-back" size={28} color={Colors.dark.text} />
          </Pressable>
          <View style={styles.dpadCenter} />
          <Pressable style={styles.dpadBtn} onPress={() => changeDir("RIGHT")}>
            <Ionicons name="chevron-forward" size={28} color={Colors.dark.text} />
          </Pressable>
        </View>
        <Pressable style={styles.dpadBtn} onPress={() => changeDir("DOWN")}>
          <Ionicons name="chevron-down" size={28} color={Colors.dark.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background, alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, alignItems: "center", justifyContent: "center" },
  gameTitle: { flex: 1, textAlign: "center", fontSize: 20, color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  scoreBox: { alignItems: "flex-end" },
  scoreLabel: { fontSize: 10, color: Colors.dark.textMuted, fontFamily: "Inter_500Medium" },
  scoreValue: { fontSize: 22, color: Colors.dark.accentGreen, fontFamily: "Inter_700Bold" },
  bestRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  bestText: { fontSize: 13, color: Colors.dark.textSecondary, fontFamily: "Inter_500Medium" },
  boardContainer: { alignItems: "center", justifyContent: "center" },
  board: { borderRadius: 8, overflow: "hidden", backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, position: "relative" },
  row: { flexDirection: "row" },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: Colors.dark.borderSubtle + "40" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,10,15,0.88)", alignItems: "center", justifyContent: "center", gap: 16, borderRadius: 8 },
  overlayTitle: { fontSize: 32, color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  overlayScore: { fontSize: 20, color: Colors.dark.accentGreen, fontFamily: "Inter_600SemiBold" },
  overlayBtn: { backgroundColor: Colors.dark.accentGreen, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  overlayBtnText: { fontSize: 16, color: "#000", fontFamily: "Inter_700Bold" },
  dpad: { marginTop: 24, alignItems: "center", gap: 4 },
  dpadRow: { flexDirection: "row", gap: 4 },
  dpadBtn: { width: 64, height: 64, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dpadCenter: { width: 64, height: 64 },
});
