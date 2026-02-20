import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/globalStyles";
import { useMapStore } from "../../store/useMapStore";
import { BaseInput } from "../form/BaseInput";
import { DynamicForm } from "../form/DynamicForm";
import { FORM_CONFIG } from "../form/postSchema";

export const AddBoardPostModal = () => {
  const { addBoardPostModalVisible, newBoardPost, updateNewBoardPostField, handleSaveBoardPost, handleBackNavigation } =
    useMapStore();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={addBoardPostModalVisible}
      onRequestClose={handleBackNavigation}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>스테이션 글쓰기</Text>

          <BaseInput
            name="emoji"
            placeholder="이모지 (예: 📝)"
            value={newBoardPost.emoji}
            onChangeText={(text) => updateNewBoardPostField("emoji", text)}
            maxLength={2}
          />

          <BaseInput
            name="title"
            placeholder="제목"
            value={newBoardPost.title}
            onChangeText={(text) => updateNewBoardPostField("title", text)}
          />

          <DynamicForm 
            config={FORM_CONFIG.boardPost} 
            values={newBoardPost} 
            onChange={(name, value) => updateNewBoardPostField(name as any, value)} 
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleBackNavigation}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveBoardPost}>
              <Text style={styles.buttonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
