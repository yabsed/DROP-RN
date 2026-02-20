import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  ViewToken,
  ViewabilityConfig,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CountdownTimer } from "../CountdownTimer";
import { styles } from "../../styles/globalStyles";
import { useMapStore } from "../../store/useMapStore";
import { BoardPost, Post } from "../../types/map";

const screenWidth = Dimensions.get("window").width;

type Props = {
  viewablePosts: Post[];
  safeInitialIndex: number;
  onViewableItemsChanged: (info: { viewableItems: Array<ViewToken<Post>> }) => void;
  viewabilityConfig: ViewabilityConfig;
};

type DetailPost = Pick<BoardPost, "id" | "emoji" | "title" | "content" | "photo" | "createdAt" | "comments">;

export const ViewPostModal = ({
  viewablePosts,
  safeInitialIndex,
  onViewableItemsChanged,
  viewabilityConfig,
}: Props) => {
  const detailScrollRefs = React.useRef<Record<string, ScrollView | null>>({});
  const [pendingScrollKey, setPendingScrollKey] = React.useState<string | null>(null);

  const {
    viewModalVisible,
    posts,
    selectedBoardPost,
    setSelectedBoardPost,
    selectedBoardPostBoardId,
    setSelectedBoardPostBoardId,
    newComment,
    setNewComment,
    handleAddComment,
    handleAddBoardPostComment,
    setTargetBoardId,
    setAddBoardPostModalVisible,
    handleBackNavigation,
  } = useMapStore();

  const registerDetailScrollRef = React.useCallback(
    (scrollKey: string) => (node: ScrollView | null) => {
      if (node) {
        detailScrollRefs.current[scrollKey] = node;
        return;
      }
      delete detailScrollRefs.current[scrollKey];
    },
    [],
  );

  const handleDetailContentSizeChange = React.useCallback(
    (scrollKey: string) => {
      if (pendingScrollKey !== scrollKey) return;

      requestAnimationFrame(() => {
        detailScrollRefs.current[scrollKey]?.scrollToEnd({ animated: true });
        setPendingScrollKey((current) => (current === scrollKey ? null : current));
      });
    },
    [pendingScrollKey],
  );

  const renderDetailPost = ({
    detailPost,
    useCountdown,
    scrollKey,
    scrollStyle,
    onSubmitComment,
  }: {
    detailPost: DetailPost;
    useCountdown: boolean;
    scrollKey: string;
    scrollStyle?: StyleProp<ViewStyle>;
    onSubmitComment: () => void;
  }) => (
    <>
      <ScrollView
        ref={registerDetailScrollRef(scrollKey)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        onContentSizeChange={() => handleDetailContentSizeChange(scrollKey)}
        style={scrollStyle}
      >
        <View style={styles.viewModalHeader}>
          <Text style={styles.viewModalEmoji}>{detailPost.emoji || "📝"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.viewModalTitle}>{detailPost.title}</Text>
            {useCountdown ? (
              <CountdownTimer createdAt={detailPost.createdAt} />
            ) : (
              <Text style={styles.timerText}>{new Date(detailPost.createdAt).toLocaleString()}</Text>
            )}
          </View>
        </View>

        {detailPost.photo && <Image source={{ uri: detailPost.photo }} style={styles.viewModalImage} resizeMode="cover" />}

        <Text style={styles.viewModalDescription}>{detailPost.content}</Text>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>댓글</Text>
          {detailPost.comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentTime}>{comment.createdAt}</Text>
            </View>
          ))}
          {detailPost.comments.length === 0 && <Text style={styles.noCommentsText}>아직 댓글이 없습니다.</Text>}
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="댓글을 입력하세요"
          placeholderTextColor="#8b8b8b"
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity
          style={styles.commentSubmitButton}
          onPress={() => {
            if (!newComment.trim()) {
              Keyboard.dismiss();
              return;
            }
            setPendingScrollKey(scrollKey);
            Keyboard.dismiss();
            onSubmitComment();
          }}
        >
          <Ionicons name="send" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal animationType="fade" transparent visible={viewModalVisible} onRequestClose={handleBackNavigation}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
        <FlatList
          data={viewablePosts}
          extraData={posts}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          initialScrollIndex={safeInitialIndex}
          getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View style={{ width: screenWidth, justifyContent: "center", alignItems: "center" }}>
              <View style={[styles.viewModalContent, { maxHeight: "80%", width: "85%" }]}>
                <View style={styles.modalTopBar}>
                  <TouchableOpacity style={styles.backButtonInline} onPress={handleBackNavigation}>
                    <Ionicons name="arrow-back" size={16} color="#8b8b8b" />
                    <Text style={styles.backButtonInlineText}>뒤로가기</Text>
                  </TouchableOpacity>
                  <View style={styles.swipeHintContainer}>
                    <Ionicons name="swap-horizontal" size={14} color="#8b8b8b" />
                    <Text style={styles.swipeHintText}>스와이프</Text>
                  </View>
                  <View style={styles.topBarSpacer} />
                </View>

                {item.type === "post" ? (
                  renderDetailPost({
                    detailPost: item,
                    useCountdown: true,
                    scrollKey: `post:${item.id}`,
                    scrollStyle: { flexShrink: 1 },
                    onSubmitComment: () => handleAddComment(item.id),
                  })
                ) : (
                  <>
                    {selectedBoardPost && selectedBoardPostBoardId === item.id ? (
                      <View style={styles.inlineBoardPostContainer}>
                        {renderDetailPost({
                          detailPost: selectedBoardPost,
                          useCountdown: false,
                          scrollKey: `boardPost:${item.id}:${selectedBoardPost.id}`,
                          scrollStyle: { maxHeight: 260, flexShrink: 1 },
                          onSubmitComment: () => handleAddBoardPostComment(item.id, selectedBoardPost.id),
                        })}
                      </View>
                    ) : (
                      <>
                        <View style={styles.boardHeader}>
                          <Text style={styles.boardEmoji}>{item.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.boardTitle}>{item.title}</Text>
                            <Text style={styles.boardDescription}>{item.description}</Text>
                          </View>
                        </View>

                        {item.photo && <Image source={{ uri: item.photo }} style={styles.boardImage} resizeMode="cover" />}

                        <View style={styles.boardPostsContainer}>
                          <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="always"
                            nestedScrollEnabled
                            style={{ flexShrink: 1 }}
                          >
                            {item.boardPosts.map((bp) => (
                              <TouchableOpacity
                                key={bp.id}
                                style={styles.boardPostItem}
                                onPress={() => {
                                  setSelectedBoardPost(bp);
                                  setSelectedBoardPostBoardId(item.id);
                                }}
                              >
                                <View style={styles.boardPostTitleRow}>
                                  <Text style={styles.boardPostEmoji}>{bp.emoji || "📝"}</Text>
                                  <Text style={styles.boardPostTitle}>{bp.title}</Text>
                                </View>
                                <Text style={styles.boardPostPreview} numberOfLines={1}>
                                  {bp.content}
                                </Text>
                                <Text style={styles.boardPostTime}>
                                  {new Date(bp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </Text>
                              </TouchableOpacity>
                            ))}
                            {item.boardPosts.length === 0 && (
                              <Text style={styles.noCommentsText}>아직 게시글이 없습니다.</Text>
                            )}
                          </ScrollView>
                        </View>

                        <View style={styles.buttonContainer}>
                          <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={() => {
                              setTargetBoardId(item.id);
                              setAddBoardPostModalVisible(true);
                            }}
                          >
                            <Text style={styles.buttonText}>글쓰기</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};
