import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../../constants/colors";

const { width, height } = Dimensions.get("window");

const BIRD_SIZE = 36;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const GRAVITY = 0.5;
const JUMP_VEL = -10;
const PIPE_SPEED = 3;
const PIPE_INTERVAL = 110;
const GROUND_H = 60;

type Pipe = { x: number; topH: number; passed: boolean; id: number };

function useTick(cb: () => void, running: boolean) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }
    const loop = () => {
      cbRef.current();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [running]);
}

export default function FlappyGame() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const gameHeight = height - topPad - GROUND_H - (Platform.OS === "web" ? 34 : insets.bottom) - 120;

  const birdY = useRef(gameHeight / 2);
  const vel = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const pipeTimer = useRef(0);
  const scoreRef = useRef(0);
  const pipeId = useRef(0);

  const [birdAnim] = useState(new Animated.Value(gameHeight / 2));
  const [birdRot] = useState(new Animated.Value(0));
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [pipeRects, setPipeRects] = useState<Pipe[]>([]);

  const gameStateRef = useRef<"idle" | "playing" | "over">("idle");
  gameStateRef.current = gameState;

  useEffect(() => {
    AsyncStorage.getItem("best_score_flappy").then((v: string | null) => {
      if (v) setBestScore(parseInt(v));
    });
  }, []);

  const endGame = useCallback(async () => {
    setGameState("over");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const s = scoreRef.current;
    const stored = await AsyncStorage.getItem("best_score_flappy");
    const prev = stored ? parseInt(stored) : 0;
    if (s > prev) {
      await AsyncStorage.setItem("best_score_flappy", String(s));
      setBestScore(s);
    }
  }, []);

  const tick = useCallback(() => {
    if (gameStateRef.current !== "playing") return;

    vel.current += GRAVITY;
    birdY.current += vel.current;

    birdAnim.setValue(birdY.current);

    const rotDeg = Math.max(-30, Math.min(90, vel.current * 5));
    birdRot.setValue(rotDeg);

    if (birdY.current < 0 || birdY.current > gameHeight - BIRD_SIZE) {
      endGame();
      return;
    }

    pipeTimer.current++;
    if (pipeTimer.current >= PIPE_INTERVAL) {
      pipeTimer.current = 0;
      const topH = Math.random() * (gameHeight - PIPE_GAP - 80) + 40;
      pipes.current.push({ x: width, topH, passed: false, id: pipeId.current++ });
    }

    pipes.current = pipes.current
      .map((p: Pipe) => ({ ...p, x: p.x - PIPE_SPEED }))
      .filter((p: Pipe) => p.x > -PIPE_WIDTH);

    const birdLeft = width / 2 - BIRD_SIZE / 2;
    const birdRight = birdLeft + BIRD_SIZE;
    const birdTop = birdY.current;
    const birdBottom = birdTop + BIRD_SIZE;

    for (const p of pipes.current) {
      const pLeft = p.x;
      const pRight = p.x + PIPE_WIDTH;
      const topPipeBottom = p.topH;
      const botPipeTop = p.topH + PIPE_GAP;

      if (birdRight > pLeft + 6 && birdLeft < pRight - 6) {
        if (birdTop < topPipeBottom || birdBottom > botPipeTop) {
          endGame();
          return;
        }
        if (!p.passed && birdLeft > pLeft + PIPE_WIDTH / 2) {
          p.passed = true;
          const ns = scoreRef.current + 1;
          scoreRef.current = ns;
          setScore(ns);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }

    setPipeRects([...pipes.current]);
  }, [birdAnim, birdRot, endGame, gameHeight]);

  useTick(tick, gameState === "playing");

  const jump = () => {
    if (gameState === "over") return;
    if (gameState === "idle") {
      startGame();
      return;
    }
    vel.current = JUMP_VEL;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startGame = () => {
    birdY.current = gameHeight / 2;
    vel.current = 0;
    pipes.current = [];
    pipeTimer.current = 0;
    scoreRef.current = 0;
    pipeId.current = 0;
    setScore(0);
    setPipeRects([]);
    birdAnim.setValue(gameHeight / 2);
    setGameState("playing");
  };

  const rotation = birdRot.interpolate({ inputRange: [-30, 90], outputRange: ["-30deg", "90deg"] });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.gameTitle}>Flappy</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Best</Text>
          <Text style={[styles.scoreValue, { color: Colors.dark.accentGold }]}>{bestScore}</Text>
        </View>
      </View>

      <TouchableWithoutFeedback onPress={jump}>
        <View style={[styles.gameArea, { height: gameHeight }]}>
          {pipeRects.map((p: Pipe) => (
            <View key={p.id}>
              <View style={[styles.pipe, { left: p.x, top: 0, height: p.topH, width: PIPE_WIDTH }]} />
              <View style={[styles.pipe, { left: p.x, top: p.topH + PIPE_GAP, height: gameHeight - p.topH - PIPE_GAP, width: PIPE_WIDTH }]} />
            </View>
          ))}

          <Animated.View
            style={[
              styles.bird,
              {
                top: birdAnim,
                left: width / 2 - BIRD_SIZE / 2,
                transform: [{ rotate: rotation }],
              },
            ]}
          >
            <Ionicons name="airplane" size={28} color="#fff" style={{ transform: [{ rotate: "90deg" }] }} />
          </Animated.View>

          <Text style={[styles.scoreDisplay, { top: 20 }]}>{score}</Text>

          {gameState === "idle" && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>Flappy</Text>
              <Ionicons name="airplane" size={48} color={Colors.dark.tint} style={{ marginVertical: 8 }} />
              <Text style={styles.overlayHint}>Tap anywhere to fly</Text>
              <Pressable style={styles.overlayBtn} onPress={startGame}>
                <Text style={styles.overlayBtnText}>Start Game</Text>
              </Pressable>
            </View>
          )}

          {gameState === "over" && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>Game Over</Text>
              <Text style={styles.overlayScore}>Score: {score}</Text>
              {score >= bestScore && score > 0 && (
                <Text style={styles.overlayRecord}>New Record!</Text>
              )}
              <Pressable style={styles.overlayBtn} onPress={startGame}>
                <Text style={styles.overlayBtnText}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.ground} />

      {gameState === "playing" && (
        <Pressable style={styles.jumpButton} onPress={jump}>
          <Ionicons name="arrow-up-circle" size={60} color={Colors.dark.tint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1B2A", alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  gameTitle: { flex: 1, textAlign: "center", fontSize: 20, color: "#fff", fontFamily: "Inter_700Bold" },
  scoreBox: { alignItems: "flex-end" },
  scoreLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_500Medium" },
  scoreValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  gameArea: { width: "100%", backgroundColor: "#1A3A5C", overflow: "hidden", position: "relative" },
  pipe: { position: "absolute", backgroundColor: Colors.dark.accentGreen, borderRadius: 4 },
  bird: { position: "absolute", width: BIRD_SIZE, height: BIRD_SIZE, backgroundColor: Colors.dark.tint, borderRadius: BIRD_SIZE / 2, alignItems: "center", justifyContent: "center" },
  scoreDisplay: { position: "absolute", alignSelf: "center", width: "100%", textAlign: "center", fontSize: 36, color: "#fff", fontFamily: "Inter_700Bold", opacity: 0.9 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,15,25,0.85)", alignItems: "center", justifyContent: "center", gap: 12 },
  overlayTitle: { fontSize: 40, color: "#fff", fontFamily: "Inter_700Bold" },
  overlayScore: { fontSize: 24, color: Colors.dark.accentGold, fontFamily: "Inter_600SemiBold" },
  overlayRecord: { fontSize: 16, color: Colors.dark.accentGold, fontFamily: "Inter_700Bold" },
  overlayHint: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  overlayBtn: { backgroundColor: Colors.dark.tint, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, marginTop: 8 },
  overlayBtnText: { fontSize: 16, color: "#fff", fontFamily: "Inter_700Bold" },
  ground: { width: "100%", height: GROUND_H, backgroundColor: "#1A3A2A", borderTopWidth: 2, borderTopColor: Colors.dark.accentGreen + "60" },
  jumpButton: { marginTop: 12, opacity: 0.9 },
});
