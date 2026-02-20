import React, { useCallback, useEffect, useRef } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { styles } from "../../styles/globalStyles";
import { useMapStore } from "../../store/useMapStore";
import { BaseInput } from "../form/BaseInput";
import { DynamicForm } from "../form/DynamicForm";
import { FORM_CONFIG } from "../form/postSchema";
import { NewPostForm } from "../../types/map";
import { recommendEmojiForPost } from "../../utils/emojiSelector";

const MIN_TEXT_LENGTH_FOR_AI = 6;
const TEXT_GROWTH_TRIGGER = 3;
const DEBOUNCE_MS = 700;
const POLLING_INTERVAL_MS = 6000;

export const CreatePostModal = () => {
  const { modalVisible, newPost, handleSavePost, handleBackNavigation } = useMapStore();

  const methods = useForm<NewPostForm>({
    defaultValues: newPost,
  });

  useEffect(() => {
    if (modalVisible) {
      methods.reset(newPost);
    }
  }, [modalVisible, newPost, methods]);

  const type = methods.watch("type");
  const title = methods.watch("title");
  const content = methods.watch("content");
  const description = methods.watch("description");

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const lastTextLengthRef = useRef(0);
  const lastPromptRef = useRef("");

  const runEmojiRecommendation = useCallback(
    async (currentTitle: string, currentBody: string) => {
      const prompt = `${currentTitle}\n${currentBody}`.trim();
      if (prompt.length < MIN_TEXT_LENGTH_FOR_AI) return;
      if (prompt === lastPromptRef.current) return;

      inFlightAbortRef.current?.abort();
      const abortController = new AbortController();
      inFlightAbortRef.current = abortController;

      const recommendedEmoji = await recommendEmojiForPost({
        title: currentTitle,
        content: currentBody,
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;
      if (!recommendedEmoji) return;

      methods.setValue("emoji", recommendedEmoji, { shouldDirty: true, shouldTouch: true });
      lastPromptRef.current = prompt;
    },
    [methods]
  );

  useEffect(() => {
    if (!modalVisible) return;

    const currentTitle = (title ?? "").trim();
    const currentBody = (type === "post" ? content : description ?? "").trim();
    const currentLength = (currentTitle + currentBody).length;

    const grewEnough = currentLength - lastTextLengthRef.current >= TEXT_GROWTH_TRIGGER;
    const shouldTrigger = currentLength >= MIN_TEXT_LENGTH_FOR_AI && grewEnough;

    lastTextLengthRef.current = currentLength;

    if (!shouldTrigger) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void runEmojiRecommendation(currentTitle, currentBody);
    }, DEBOUNCE_MS);
  }, [modalVisible, type, title, content, description, runEmojiRecommendation]);

  useEffect(() => {
    if (!modalVisible) return;

    pollingTimerRef.current = setInterval(() => {
      const currentType = methods.getValues("type");
      const currentTitle = (methods.getValues("title") ?? "").trim();
      const currentBody =
        (currentType === "post" ? methods.getValues("content") : methods.getValues("description") ?? "").trim();
      void runEmojiRecommendation(currentTitle, currentBody);
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [modalVisible, methods, runEmojiRecommendation]);

  useEffect(() => {
    if (modalVisible) return;

    lastTextLengthRef.current = 0;
    lastPromptRef.current = "";

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    inFlightAbortRef.current?.abort();
    inFlightAbortRef.current = null;
  }, [modalVisible]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
      inFlightAbortRef.current?.abort();
    };
  }, []);

  const onSubmit = (data: NewPostForm) => {
    handleSavePost(data);
  };

  return (
    <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={handleBackNavigation}>
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{type === "post" ? "포스트 추가" : "스테이션 만들기"}</Text>

          <FormProvider {...methods}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === "post" && styles.typeButtonActive]}
                onPress={() => methods.setValue("type", "post")}
              >
                <Text style={[styles.typeButtonText, type === "post" && styles.typeButtonTextActive]}>
                  포스트
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === "board" && styles.typeButtonActive]}
                onPress={() => methods.setValue("type", "board")}
              >
                <Text style={[styles.typeButtonText, type === "board" && styles.typeButtonTextActive]}>
                  스테이션
                </Text>
              </TouchableOpacity>
            </View>

            <BaseInput
              name="emoji"
              placeholder="이모지 (예: 🍔, ☕)"
              maxLength={2}
            />

            <BaseInput
              name="title"
              placeholder={type === "post" ? "제목" : "스테이션 이름"}
            />

            <DynamicForm
              config={FORM_CONFIG[type] || []}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleBackNavigation}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={methods.handleSubmit(onSubmit)}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </FormProvider>
        </View>
      </View>
    </Modal>
  );
};
