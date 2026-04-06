import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// ── 1. 資料型別定義 ──────────────────────────────
interface Category {
  id: string;
  name: string;
  icon: string;
  defaultColor: string;
}

interface Task {
  id: string;
  categoryId: string;
  title: string;
  done: boolean;
  color: string; // 每個任務獨立的顏色回來了！
}

// 可選顏色清單
const COLORS = ["#007AFF", "#FF9500", "#34C759", "#FF3B30", "#AF52DE", "#5856D6"];

// ── 2. 初始假資料 ──────────────────────────────
const INITIAL_CATEGORIES: Category[] = [
  { id: "c1", name: "提醒事項", icon: "📋", defaultColor: "#007AFF" },
  { id: "c2", name: "工作", icon: "💼", defaultColor: "#FF9500" },
];

const INITIAL_TASKS: Task[] = [
  { id: "t1", categoryId: "c1", title: "買牛奶", done: false, color: "#007AFF" },
  { id: "t2", categoryId: "c1", title: "繳電費", done: true, color: "#FF3B30" },
  { id: "t3", categoryId: "c2", title: "回覆客戶 Email", done: false, color: "#FF9500" },
];

// ========================================
export default function TodoList() {
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  
  // 導覽狀態 (null=分類頁, string=該分類的列表頁)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Modal 與表單狀態
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // 判斷是新增還是修改
  const [inputText, setInputText] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);

  // ── 核心邏輯區 ──────────────────────────────
  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    );
  };

  const deleteTask = (taskId: string, title: string) => {
    Alert.alert("刪除任務", `確定要刪除「${title}」嗎？`, [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: () => setTasks((prev) => prev.filter((task) => task.id !== taskId)),
      },
    ]);
  };

  const saveTask = () => {
    if (!inputText.trim() || !activeCategoryId) return;

    if (editingId) {
      // 修改現有任務
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, title: inputText.trim(), color: selectedColor } : t
        )
      );
    } else {
      // 新增任務
      const newTask: Task = {
        id: Date.now().toString(),
        categoryId: activeCategoryId,
        title: inputText.trim(),
        done: false,
        color: selectedColor,
      };
      setTasks((prev) => [...prev, newTask]);
    }
    closeModal();
  };

  const openAddModal = (defaultColor: string) => {
    setEditingId(null);
    setInputText("");
    setSelectedColor(defaultColor);
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingId(task.id);
    setInputText(task.title);
    setSelectedColor(task.color);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setInputText("");
    setEditingId(null);
  };

  // 取得當前畫面資料
  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const currentTasks = tasks.filter((t) => t.categoryId === activeCategoryId);

  // ========================================
  // 頁面 1：分類列表頁
  // ========================================
  const renderCategoriesPage = () => (
    <View style={styles.pageContainer}>
      <Text style={styles.largeTitle}>我的列表</Text>
      <View style={styles.listCard}>
        {categories.map((item, index) => {
          const taskCount = tasks.filter((t) => t.categoryId === item.id && !t.done).length;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.categoryRow, index === categories.length - 1 && styles.lastCategoryRow]}
              onPress={() => setActiveCategoryId(item.id)}
            >
              <View style={styles.categoryLeft}>
                <View style={[styles.iconCircle, { backgroundColor: item.defaultColor }]}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{item.name}</Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.taskCount}>{taskCount}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ========================================
  // 頁面 2：任務列表頁 (包含修改、刪除、自定義顏色)
  // ========================================
  const renderTasksPage = () => (
    <View style={styles.pageContainer}>
      {/* 導覽列 */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveCategoryId(null)}>
          <Text style={styles.backButtonIcon}>‹</Text>
          <Text style={styles.backButtonText}>列表</Text>
        </TouchableOpacity>
      </View>

      {/* 大標題 */}
      <Text style={[styles.largeTitle, { color: activeCategory?.defaultColor }]}>
        {activeCategory?.name}
      </Text>

      {/* 任務清單 */}
      <FlatList
        data={currentTasks}
        keyExtractor={(item) => item.id}
        style={styles.tasksFlatList}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            {/* 左側：完成勾選框 (套用專屬顏色) */}
            <TouchableOpacity onPress={() => toggleTask(item.id)} style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox, 
                { borderColor: item.color },
                item.done && { backgroundColor: item.color, borderWidth: 0 }
              ]}>
                {item.done && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            
            {/* 中間：文字內容 */}
            <View style={styles.taskTextContainer}>
              <Text style={[styles.taskTitle, item.done && styles.taskTitleDone]}>
                {item.title}
              </Text>
            </View>

            {/* 右側：動作按鈕群 (修改 & 刪除回來了！) */}
            <View style={styles.actionGroup}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                <Text style={styles.actionIconText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTask(item.id, item.title)} style={styles.actionBtn}>
                <Text style={styles.actionIconText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* 底部新增按鈕 */}
      <TouchableOpacity 
        style={styles.bottomAddButton} 
        onPress={() => openAddModal(activeCategory?.defaultColor || COLORS[0])}
      >
        <Text style={[styles.addIcon, { color: activeCategory?.defaultColor }]}>⊕</Text>
        <Text style={[styles.addText, { color: activeCategory?.defaultColor }]}>新增提醒事項</Text>
      </TouchableOpacity>
    </View>
  );

  // ========================================
  // 主畫面與 Modal
  // ========================================
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        
        {activeCategoryId ? renderTasksPage() : renderCategoriesPage()}

        {/* 增改兩用 Modal (加入顏色選擇器) */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal}>
                  <Text style={styles.modalCancel}>取消</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{editingId ? "修改項目" : "新增項目"}</Text>
                <TouchableOpacity onPress={saveTask} disabled={!inputText.trim()}>
                  <Text style={[styles.modalAdd, !inputText.trim() && styles.modalAddDisabled]}>
                    {editingId ? "儲存" : "加入"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputCard}>
                <TextInput
                  style={styles.input}
                  placeholder="輸入標題..."
                  value={inputText}
                  onChangeText={setInputText}
                  autoFocus
                />
                
                {/* 顏色選擇器回來了！ */}
                <View style={styles.colorPickerContainer}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c },
                        selectedColor === c && styles.selectedColorCircle
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ========================================
// 樣式設定
// ========================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  pageContainer: { flex: 1 },
  largeTitle: { fontSize: 34, fontWeight: "bold", marginHorizontal: 20, marginTop: 10, marginBottom: 10 },
  
  // 分類頁樣式
  listCard: { backgroundColor: "#FFF", borderRadius: 12, marginHorizontal: 20, overflow: "hidden" },
  categoryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingLeft: 16, paddingRight: 16, borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA", marginLeft: 16 },
  lastCategoryRow: { borderBottomWidth: 0 },
  categoryLeft: { flexDirection: "row", alignItems: "center" },
  iconCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 12, marginLeft: -16 },
  iconText: { fontSize: 16 },
  categoryName: { fontSize: 17, color: "#000" },
  categoryRight: { flexDirection: "row", alignItems: "center" },
  taskCount: { fontSize: 17, color: "#8E8E93", marginRight: 8 },
  chevron: { fontSize: 20, color: "#C6C6C8", marginTop: -2 },

  // 任務列表頁樣式
  navBar: { flexDirection: "row", alignItems: "center", height: 44, paddingHorizontal: 10 },
  backButton: { flexDirection: "row", alignItems: "center" },
  backButtonIcon: { fontSize: 34, color: "#007AFF", marginTop: -4, marginRight: 2 },
  backButtonText: { fontSize: 17, color: "#007AFF" },
  tasksFlatList: { backgroundColor: "#FFF", borderRadius: 12, marginHorizontal: 20, flex: 1, marginTop: 10 },
  taskRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingLeft: 16, paddingRight: 12, borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA", marginLeft: 16 },
  checkboxContainer: { paddingVertical: 5, paddingRight: 12, marginLeft: -16 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  taskTextContainer: { flex: 1, justifyContent: "center" },
  taskTitle: { fontSize: 17, color: "#000" },
  taskTitleDone: { color: "#8E8E93", textDecorationLine: "line-through" },
  
  // 新增：右側編輯/刪除按鈕群
  actionGroup: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionBtn: { padding: 4 },
  actionIconText: { fontSize: 18 },

  bottomAddButton: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  addIcon: { fontSize: 24, fontWeight: "bold", marginRight: 8 },
  addText: { fontSize: 17, fontWeight: "600" },

  // Modal 樣式
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { backgroundColor: "#F2F2F7", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#C6C6C8" },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  modalCancel: { fontSize: 17, color: "#007AFF" },
  modalAdd: { fontSize: 17, fontWeight: "bold", color: "#007AFF" },
  modalAddDisabled: { color: "#B0D7FF" },
  inputCard: { backgroundColor: "#FFF", margin: 16, borderRadius: 12, padding: 16 },
  input: { fontSize: 17, marginBottom: 20 },
  
  // 新增：顏色選擇器樣式
  colorPickerContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 10, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: "#E5E5EA" },
  colorCircle: { width: 30, height: 30, borderRadius: 15 },
  selectedColorCircle: { borderWidth: 3, borderColor: "#000" },
});