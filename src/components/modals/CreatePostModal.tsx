import React from "react";
import { Image, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "../../styles/globalStyles";
import { useMapStore } from "../../store/useMapStore";

export const CreatePostModal = () => {
  const { modalVisible, newPost, updateNewPostField, handleSavePost, handleBackNavigation } = useMapStore();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      updateNewPostField("photo", result.assets[0].uri);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={handleBackNavigation}>
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{newPost.type === "post" ? "포스트 추가" : "스테이션 만들기"}</Text>

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, newPost.type === "post" && styles.typeButtonActive]}
              onPress={() => updateNewPostField("type", "post")}
            >
              <Text style={[styles.typeButtonText, newPost.type === "post" && styles.typeButtonTextActive]}>
                포스트
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, newPost.type === "board" && styles.typeButtonActive]}
              onPress={() => updateNewPostField("type", "board")}
            >
              <Text style={[styles.typeButtonText, newPost.type === "board" && styles.typeButtonTextActive]}>
                스테이션
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="이모지 (예: 📍, 🍔)"
            placeholderTextColor="#8b8b8b"
            value={newPost.emoji}
            onChangeText={(text) => updateNewPostField("emoji", text)}
            maxLength={2}
          />

          <TextInput
            style={styles.input}
            placeholder={newPost.type === "post" ? "제목" : "스테이션 이름"}
            placeholderTextColor="#8b8b8b"
            value={newPost.title}
            onChangeText={(text) => updateNewPostField("title", text)}
          />

          {newPost.type === "post" ? (
            <>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="내용을 입력하세요"
                placeholderTextColor="#8b8b8b"
                value={newPost.content}
                onChangeText={(text) => updateNewPostField("content", text)}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <Text style={styles.photoButtonText}>{newPost.photo ? "사진 변경" : "사진 추가"}</Text>
              </TouchableOpacity>
              {newPost.photo && <Image source={{ uri: newPost.photo }} style={styles.previewImage} />}
            </>
          ) : (
            <>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="스테이션 설명을 입력하세요"
                placeholderTextColor="#8b8b8b"
                value={newPost.description}
                onChangeText={(text) => updateNewPostField("description", text)}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <Text style={styles.photoButtonText}>{newPost.photo ? "사진 변경" : "사진 추가"}</Text>
              </TouchableOpacity>
              {newPost.photo && <Image source={{ uri: newPost.photo }} style={styles.previewImage} />}
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleBackNavigation}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSavePost}>
              <Text style={styles.buttonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
