import React, { useCallback, useEffect, useRef } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { styles } from "../../styles/globalStyles";
import { useMapStore } from "../../store/useMapStore";
import { BaseInput } from "../form/BaseInput";
import { DynamicForm } from "../form/DynamicForm";
import { FORM_CONFIG } from "../form/postSchema";
import { NewBoardPostForm } from "../../types/map";
import { recommendEmojiForPost } from "../../utils/emojiSelector";

const MIN_TEXT_LENGTH_FOR_AI = 6;
const TEXT_GROWTH_TRIGGER = 3;
const DEBOUNCE_MS = 700;
const POLLING_INTERVAL_MS = 6000;

export const AddBoardPostModal = () => {
  const { addBoardPostModalVisible, newBoardPost, handleSaveBoardPost, handleBackNavigation } = useMapStore();

  const methods = useForm<NewBoardPostForm>({
    defaultValues: newBoardPost,
  });

  useEffect(() => {
    if (addBoardPostModalVisible) {
      methods.reset(newBoardPost);
    }
  }, [addBoardPostModalVisible, newBoardPost, methods]);

  const title = methods.watch("title");
  const content = methods.watch("content");

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const lastTextLengthRef = useRef(0);
  const lastPromptRef = useRef("");

  const runEmojiRecommendation = useCallback(
    async (currentTitle: string, currentContent: string) => {
      const prompt = `${currentTitle}\n${currentContent}`.trim();
      if (prompt.length < MIN_TEXT_LENGTH_FOR_AI) return;
      if (prompt === lastPromptRef.current) return;

      inFlightAbortRef.current?.abort();
      const abortController = new AbortController();
      inFlightAbortRef.current = abortController;

      const recommendedEmoji = await recommendEmojiForPost({
        title: currentTitle,
        content: currentContent,
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
    if (!addBoardPostModalVisible) return;

    const currentTitle = (title ?? "").trim();
    const currentContent = (content ?? "").trim();
    const currentLength = (currentTitle + currentContent).length;

    const grewEnough = currentLength - lastTextLengthRef.current >= TEXT_GROWTH_TRIGGER;
    const shouldTrigger = currentLength >= MIN_TEXT_LENGTH_FOR_AI && grewEnough;

    lastTextLengthRef.current = currentLength;

    if (!shouldTrigger) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void runEmojiRecommendation(currentTitle, currentContent);
    }, DEBOUNCE_MS);
  }, [addBoardPostModalVisible, title, content, runEmojiRecommendation]);

  useEffect(() => {
    if (!addBoardPostModalVisible) return;

    pollingTimerRef.current = setInterval(() => {
      const currentTitle = (methods.getValues("title") ?? "").trim();
      const currentContent = (methods.getValues("content") ?? "").trim();
      void runEmojiRecommendation(currentTitle, currentContent);
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [addBoardPostModalVisible, methods, runEmojiRecommendation]);

  useEffect(() => {
    if (addBoardPostModalVisible) return;

    lastTextLengthRef.current = 0;
    lastPromptRef.current = "";

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    inFlightAbortRef.current?.abort();
    inFlightAbortRef.current = null;
  }, [addBoardPostModalVisible]);

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

  const onSubmit = (data: NewBoardPostForm) => {
    handleSaveBoardPost(data);
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

          <FormProvider {...methods}>
            <BaseInput
              name="emoji"
              placeholder="이모지 (예: 🍔)"
              maxLength={2}
            />

            <BaseInput
              name="title"
              placeholder="제목"
            />

            <DynamicForm
              config={FORM_CONFIG.boardPost}
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
