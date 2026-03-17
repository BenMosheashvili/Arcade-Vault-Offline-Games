import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, PanResponder, Pressable, StyleSheet, Text, View, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/colors";

const { width, height } = Dimensions.get("window");
const PAD_W = 100;
const PAD_H = 15;
const BALL_SIZE = 16;
const WIN_SCORE = 7;

export default function PongGame() {
  const router = useRouter();
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState({ p: 0, c: 0 });

  const ballPos = useRef(new Animated.ValueXY({ x: width / 2, y: height / 2 })).current;
  const playerX = useRef(new Animated.Value(width / 2 - PAD_W / 2)).current;
  const cpuX = useRef(new Animated.Value(width / 2 - PAD_W / 2)).current;

  const bPos = useRef({ x: width / 2, y: height / 2 });
  const bVel = useRef({ x: 3, y: 3 });
  const pX = useRef(width / 2 - PAD_W / 2);
  const cX = useRef(width / 2 - PAD_W / 2);

  const resetPoint = (winner: 'p' | 'c') => {
    bPos.current = { x: width / 2, y: height / 2 };
    bVel.current = { x: (Math.random() > 0.5 ? 4 : -4), y: winner === 'p' ? -4 : 4 };
    ballPos.setValue(bPos.current);
  };

  const startGame = () => {
    setScore({ p: 0, c: 0 });
    resetPoint('p');
    setGameState("playing");
  };

  useEffect(() => {
    let frame: number;
    if (gameState === "playing") {
      const move = () => {
        let { x, y } = bPos.current;
        let { x: vx, y: vy } = bVel.current;
        x += vx; y += vy;

        // Wall bounce
        if (x <= 0 || x >= width - BALL_SIZE) vx *= -1;

        // Paddle Collision logic
        if (y >= height - 160 && x >= pX.current - 10 && x <= pX.current + PAD_W + 10) {
          vy = -Math.abs(vy) * 1.05; // הגברת מהירות
          y = height - 161;
        }
        if (y <= 100 && x >= cX.current - 10 && x <= cX.current + PAD_W + 10) {
          vy = Math.abs(vy) * 1.05;
          y = 101;
        }

        // Scoring
        if (y < 0) {
          setScore(prev => {
            const newScore = { ...prev, p: prev.p + 1 };
            if (newScore.p >= WIN_SCORE) setGameState("over");
            else resetPoint('p');
            return newScore;
          });
        } else if (y > height) {
          setScore(prev => {
            const newScore = { ...prev, c: prev.c + 1 };
            if (newScore.c >= WIN_SCORE) setGameState("over");
            else resetPoint('c');
            return newScore;
          });
        }

        bPos.current = { x, y };
        bVel.current = { x: vx, y: vy };
        ballPos.setValue({ x, y });

        // CPU AI - עכשיו עם "טעות אנוש"
        const cpuTarget = x - PAD_W / 2;
        cX.current += (cpuTarget - cX.current) * 0.07; // מהירות תגובה איטית יותר
        cpuX.setValue(cX.current);

        frame = requestAnimationFrame(move);
      };
      frame = requestAnimationFrame(move);
    }
    return () => cancelAnimationFrame(frame);
  }, [gameState]);

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e, gs) => {
      let newX = gs.moveX - PAD_W / 2;
      newX = Math.max(0, Math.min(width - PAD_W, newX));
      pX.current = newX;
      playerX.setValue(newX);
    }
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={28} color="white" />
      </Pressable>
      <View style={styles.arena} {...pan.panHandlers}>
        <View style={styles.centerLine} />
        <Text style={styles.scoreText}>{score.c}  -  {score.p}</Text>
        <Animated.View style={[styles.ball, ballPos.getLayout()]} />
        <Animated.View style={[styles.paddle, { top: 80, left: cpuX, backgroundColor: Colors.dark.accentWarm }]} />
        <Animated.View style={[styles.paddle, { bottom: 120, left: playerX, backgroundColor: Colors.dark.accentGreen }]} />
      </View>
      {gameState !== "playing" && (
        <View style={styles.fullOverlay}>
          <Text style={styles.title}>{gameState === "over" ? (score.p >= WIN_SCORE ? "ניצחת!" : "הפסדת!") : "PONG"}</Text>
          <Pressable style={styles.btn} onPress={startGame}>
            <Text style={styles.btnText}>{gameState === "over" ? "שחק שוב" : "התחל"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  backBtn: { position: "absolute", top: 50, left: 20, zIndex: 1000, padding: 10 },
  arena: { flex: 1 },
  ball: { position: "absolute", width: BALL_SIZE, height: BALL_SIZE, borderRadius: 10, backgroundColor: "#fff", shadowColor: "#fff", shadowRadius: 10, shadowOpacity: 0.5 },
  paddle: { position: "absolute", width: PAD_W, height: PAD_H, borderRadius: 8 },
  centerLine: { position: "absolute", top: height / 2, left: 0, right: 0, height: 1, backgroundColor: "#222" },
  scoreText: { position: "absolute", top: height / 2 - 30, alignSelf: "center", fontSize: 50, color: "#111", fontWeight: "900" },
  fullOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", zIndex: 999 },
  title: { fontSize: 40, color: "#fff", marginBottom: 30, fontWeight: "bold" },
  btn: { backgroundColor: Colors.dark.accentGreen, paddingHorizontal: 50, paddingVertical: 18, borderRadius: 40 },
  btnText: { fontSize: 20, fontWeight: "bold", color: "#000" }
});