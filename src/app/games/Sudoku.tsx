import React, { useEffect, useRef, useState } from "react";
import {
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
const BOARD_SIZE = width - 32;
const CELL_SIZE = BOARD_SIZE / 9;

type Board = (number | null)[][];
type Fixed = boolean[][];

function generateSudoku(difficulty: "easy" | "medium" | "hard"): { board: Board; fixed: Fixed; solution: Board } {
  const base = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2], [6, 7, 2, 1, 9, 5, 3, 4, 8], [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3], [4, 2, 6, 8, 5, 3, 7, 9, 1], [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4], [2, 8, 7, 4, 1, 9, 6, 3, 5], [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];
  const rows = [...Array(9)].map((_, i) => i), cols = [...Array(9)].map((_, i) => i);
  rows.sort(() => Math.random() - 0.5); cols.sort(() => Math.random() - 0.5);
  const shuffled: Board = rows.map(r => cols.map(c => base[r][c]));
  const solution: Board = shuffled.map(r => [...r]);
  const remove = difficulty === "easy" ? 35 : difficulty === "medium" ? 45 : 55;
  const board: Board = shuffled.map(r => [...r]);
  const fixed: Fixed = board.map(r => r.map(() => true));
  let removed = 0;
  while (removed < remove) {
    const r = Math.floor(Math.random() * 9), c = Math.floor(Math.random() * 9);
    if (board[r][c] !== null) { board[r][c] = null; fixed[r][c] = false; removed++; }
  }
  return { board, fixed, solution };
}

export default function SudokuGame() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [board, setBoard] = useState<Board>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [fixed, setFixed] = useState<Fixed>(Array(9).fill(null).map(() => Array(9).fill(false)));
  const [solution, setSolution] = useState<Board>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won">("idle");
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(`best_score_sudoku_${difficulty}`).then((v: string | null) => { if (v) setBestTime(parseInt(v)); });
  }, [difficulty]);

  const startGame = () => {
    const g = generateSudoku(difficulty);
    setBoard(g.board);
    setFixed(g.fixed);
    setSolution(g.solution);
    setSelected(null);
    setErrors(new Set());
    setMistakes(0);
    setTimer(0);
    setGameState("playing");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const selectCell = (r: number, c: number) => { setSelected([r, c]); Haptics.selectionAsync(); };

  const inputNum = (n: number) => {
    if (!selected || gameState !== "playing") return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = n;
    const newErrors = new Set(errors);
    const key = `${r},${c}`;
    if (solution[r] && solution[r][r] !== undefined && solution[r][c] !== n) {
      newErrors.add(key);
      setMistakes(m => m + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    else {
      newErrors.delete(key);
      if (solution[r] && solution[r][c] === n) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setErrors(newErrors);
    setBoard(newBoard);
    if (newBoard.every((row, ri) => row.every((v, ci) => v !== null && v === solution[ri]?.[ci]))) {
      setGameState("won");
      if (timerRef.current) clearInterval(timerRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AsyncStorage.getItem(`best_score_sudoku_${difficulty}`).then(async (v: string | null) => {
        const prev = v ? parseInt(v) : Infinity;
        if (timer < prev) { await AsyncStorage.setItem(`best_score_sudoku_${difficulty}`, String(timer)); setBestTime(timer); }
      });
    }
  };

  const erase = () => {
    if (!selected || gameState !== "playing") return;
    const [r, c] = selected;
    if (fixed[r][c]) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = null;
    const newErrors = new Set(errors);
    newErrors.delete(`${r},${c}`);
    setErrors(newErrors);
    setBoard(newBoard);
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const selVal = selected ? board[selected[0]][selected[1]] : null;
  const selRow = selected?.[0], selCol = selected?.[1];

  const getCellBg = (r: number, c: number, val: number | null) => {
    const isSelected = selRow === r && selCol === c;
    const isSameNum = val && selVal && val === selVal && !isSelected;
    const isGroup = (selRow !== undefined && selCol !== undefined) && (selRow === r || selCol === c || (Math.floor(selRow / 3) === Math.floor(r / 3) && Math.floor(selCol / 3) === Math.floor(c / 3)));
    if (isSelected) return Colors.dark.tint + "60";
    if (isSameNum) return Colors.dark.tint + "25";
    if (isGroup) return Colors.dark.surfaceElevated;
    return Colors.dark.surface;
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => { if (timerRef.current) clearInterval(timerRef.current); router.back(); }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.gameTitle}>Sudoku</Text>
        <View style={styles.timerBox}>
          <Ionicons name="timer-outline" size={14} color={Colors.dark.textMuted} />
          <Text style={styles.timerText}>{fmtTime(timer)}</Text>
        </View>
      </View>

      <View style={styles.diffRow}>
        {(["easy", "medium", "hard"] as const).map(d => (
          <Pressable key={d} style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]} onPress={() => setDifficulty(d)}>
            <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d === "easy" ? "קל" : d === "medium" ? "בינוני" : "קשה"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>שגיאות</Text>
          <Text style={[styles.statVal, { color: Colors.dark.accentWarm }]}>{mistakes}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>שיא</Text>
          <Text style={[styles.statVal, { color: Colors.dark.accentGold }]}>{bestTime ? fmtTime(bestTime) : "—"}</Text>
        </View>
      </View>

      <View style={[styles.sudokuBoard, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        {board.map((row: (number | null)[], r: number) => (
          <View key={r} style={styles.sudokuRow}>
            {row.map((val: number | null, c: number) => (
              <Pressable key={c} onPress={() => selectCell(r, c)}
                style={[
                  styles.sudokuCell,
                  { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: getCellBg(r, c, val) },
                  c % 3 === 2 && c !== 8 && styles.thickRight,
                  r % 3 === 2 && r !== 8 && styles.thickBottom,
                  errors.has(`${r},${c}`) && styles.errorCell,
                ]}>
                {val ? <Text style={[styles.cellNum, fixed[r][c] ? styles.fixedNum : styles.inputNum, errors.has(`${r},${c}`) && { color: Colors.dark.accentWarm }]}>{val}</Text> : null}
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.numPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <Pressable key={n} style={styles.numBtn} onPress={() => inputNum(n)}>
            <Text style={styles.numBtnText}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.eraseBtn} onPress={erase}>
        <Ionicons name="backspace-outline" size={20} color={Colors.dark.textSecondary} />
        <Text style={styles.eraseText}>מחק</Text>
      </Pressable>

      {(gameState === "idle" || gameState === "won") && (
        <View style={styles.overlay}>
          {gameState === "won" && <Ionicons name="trophy" size={48} color={Colors.dark.accentGold} />}
          <Text style={styles.overlayTitle}>{gameState === "won" ? "כל הכבוד!" : "סודוקו"}</Text>
          {gameState === "won" && <Text style={styles.overlayScore}>זמן: {fmtTime(timer)}</Text>}
          <Pressable style={styles.overlayBtn} onPress={startGame}>
            <Text style={styles.overlayBtnText}>{gameState === "won" ? "שחק שוב" : "התחל"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background, alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", width: "100%", paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border, alignItems: "center", justifyContent: "center" },
  gameTitle: { flex: 1, textAlign: "center", fontSize: 20, color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  timerBox: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.dark.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.dark.border },
  timerText: { fontSize: 13, color: Colors.dark.text, fontFamily: "Inter_600SemiBold" },
  diffRow: { flexDirection: "row", gap: 8, marginBottom: 10, backgroundColor: Colors.dark.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.dark.border },
  diffBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 9 },
  diffBtnActive: { backgroundColor: Colors.dark.tint },
  diffText: { fontSize: 13, color: Colors.dark.textSecondary, fontFamily: "Inter_600SemiBold" },
  diffTextActive: { color: "#fff" },
  statsRow: { flexDirection: "row", gap: 24, marginBottom: 10 },
  statItem: { alignItems: "center" },
  statLabel: { fontSize: 11, color: Colors.dark.textMuted, fontFamily: "Inter_400Regular" },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sudokuBoard: { borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: Colors.dark.border, marginBottom: 16 },
  sudokuRow: { flexDirection: "row" },
  sudokuCell: { borderWidth: 0.5, borderColor: Colors.dark.border + "60", alignItems: "center", justifyContent: "center" },
  thickRight: { borderRightWidth: 2, borderRightColor: Colors.dark.border },
  thickBottom: { borderBottomWidth: 2, borderBottomColor: Colors.dark.border },
  errorCell: { borderColor: Colors.dark.accentWarm + "80" },
  cellNum: { fontSize: Math.floor(CELL_SIZE * 0.5) },
  fixedNum: { color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  inputNum: { color: Colors.dark.tint, fontFamily: "Inter_600SemiBold" },
  numPad: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", width: BOARD_SIZE },
  numBtn: { width: (BOARD_SIZE - 64) / 9, height: (BOARD_SIZE - 64) / 9, backgroundColor: Colors.dark.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.dark.border, alignItems: "center", justifyContent: "center" },
  numBtnText: { fontSize: 18, color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  eraseBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: Colors.dark.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 16, paddingVertical: 8 },
  eraseText: { fontSize: 14, color: Colors.dark.textSecondary, fontFamily: "Inter_600SemiBold" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,10,15,0.92)", alignItems: "center", justifyContent: "center", gap: 14 },
  overlayTitle: { fontSize: 32, color: Colors.dark.text, fontFamily: "Inter_700Bold" },
  overlayScore: { fontSize: 20, color: Colors.dark.accentGold, fontFamily: "Inter_600SemiBold" },
  overlayBtn: { backgroundColor: Colors.dark.tint, paddingHorizontal: 32, paddingVertical: 13, borderRadius: 28 },
  overlayBtnText: { fontSize: 15, color: "#fff", fontFamily: "Inter_700Bold" },
});
