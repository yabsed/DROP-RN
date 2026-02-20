import React from "react";
import { Image, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "../../styles/globalStyles";
import { useMapStore } from "../../store/useMapStore";

export const AddBoardPostModal = () => {
  const { addBoardPostModalVisible, newBoardPost, updateNewBoardPostField, handleSaveBoardPost, handleBackNavigation } =
    useMapStore();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      updateNewBoardPostField("photo", result.assets[0].uri);
    }
  };

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

          <TextInput
            style={styles.input}
            placeholder="이모지 (예: 📝)"
            placeholderTextColor="#8b8b8b"
            value={newBoardPost.emoji}
            onChangeText={(text) => updateNewBoardPostField("emoji", text)}
            maxLength={2}
          />

          <TextInput
            style={styles.input}
            placeholder="제목"
            placeholderTextColor="#8b8b8b"
            value={newBoardPost.title}
            onChangeText={(text) => updateNewBoardPostField("title", text)}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="내용을 입력하세요"
            placeholderTextColor="#8b8b8b"
            value={newBoardPost.content}
            onChangeText={(text) => updateNewBoardPostField("content", text)}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
            <Text style={styles.photoButtonText}>{newBoardPost.photo ? "사진 변경" : "사진 추가"}</Text>
          </TouchableOpacity>
          {newBoardPost.photo && <Image source={{ uri: newBoardPost.photo }} style={styles.previewImage} />}

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
