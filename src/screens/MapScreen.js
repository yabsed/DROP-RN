import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, Modal, TextInput, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, FlatList, Dimensions, BackHandler } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';

import { initialPosts } from '../../dummyData';
import { CustomMarker } from '../components/CustomMarker';
import { CountdownTimer } from '../components/CountdownTimer';
import { styles } from '../styles/globalStyles';
import { customMapStyle } from '../styles/mapStyles';
import { SERVER_URL, INITIAL_REGION } from '../utils/constants';

const screenWidth = Dimensions.get('window').width;

export default function MapScreen() {
  const [myLocation, setMyLocation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  
  // 게시물(점) 및 게시판 관련 상태
  const [posts, setPosts] = useState(initialPosts);
  const [modalVisible, setModalVisible] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [newPost, setNewPost] = useState({ coordinate: null, emoji: '📍', title: '', content: '', description: '', photo: null, type: 'post' });
  
  // 선택된 게시물 보기 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');

  // 게시판 관련 상태
  const [selectedBoardPost, setSelectedBoardPost] = useState(null);
  const [selectedBoardPostBoardId, setSelectedBoardPostBoardId] = useState(null);
  const [addBoardPostModalVisible, setAddBoardPostModalVisible] = useState(false);
  const [newBoardPost, setNewBoardPost] = useState({ emoji: '📝', title: '', content: '', photo: null });
  const [targetBoardId, setTargetBoardId] = useState(null);

  const socketRef = useRef(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);
  const mapRegionRef = useRef(INITIAL_REGION);

  const handleBackNavigation = () => {
    if (selectedBoardPost && selectedBoardPostBoardId) {
      setSelectedBoardPost(null);
      setSelectedBoardPostBoardId(null);
      setNewComment('');
      return true;
    }

    if (addBoardPostModalVisible) {
      setAddBoardPostModalVisible(false);
      setTargetBoardId(null);
      return true;
    }

    if (viewModalVisible) {
      setViewModalVisible(false);
      setSelectedBoardPost(null);
      setSelectedBoardPostBoardId(null);
      return true;
    }

    if (modalVisible) {
      setModalVisible(false);
      return true;
    }

    return false;
  };

  useEffect(() => {
    // 소켓 연결
    socketRef.current = io(SERVER_URL);

    socketRef.current.on('users_update', (users) => {
      // 나를 제외한 다른 사용자 찾기 (데모용으로 1명만 있다고 가정)
      const others = users.filter(u => u.socketId !== socketRef.current.id);
      if (others.length > 0) {
        const other = others[0];
        setOtherUser(other);
      } else {
        setOtherUser(null);
      }
    });

    startTracking();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (locationSubscription.current) locationSubscription.current.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBackPress = () => handleBackNavigation();

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => subscription.remove();
  }, [selectedBoardPost, selectedBoardPostBoardId, addBoardPostModalVisible, viewModalVisible, modalVisible]);

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 거부', '위치 권한이 필요합니다.');
      return;
    }

    // 위치 추적 시작
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      (loc) => {
        setMyLocation(loc.coords);
        // 서버로 내 정보 전송
        if (socketRef.current) {
          socketRef.current.emit('update_data', {
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
          });
        }
      }
    );
  };

  const handleMapPress = (e) => {
    if (isAddingPost) {
      setNewPost({ ...newPost, coordinate: e.nativeEvent.coordinate });
      setIsAddingPost(false);
      setModalVisible(true);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewPost({ ...newPost, photo: result.assets[0].uri });
    }
  };

  const handleSavePost = () => {
    if (newPost.type === 'post') {
      if (!newPost.title || !newPost.content) {
        Alert.alert('오류', '제목과 내용을 입력해주세요.');
        return;
      }
      setPosts([...posts, { ...newPost, id: Date.now().toString(), comments: [], createdAt: Date.now() }]);
    } else {
      if (!newPost.title || !newPost.description) {
        Alert.alert('오류', '스테이션 이름과 설명을 입력해주세요.');
        return;
      }
      setPosts([...posts, { ...newPost, id: Date.now().toString(), boardPosts: [], createdAt: Date.now() }]);
    }
    setModalVisible(false);
    setNewPost({ coordinate: null, emoji: '📍', title: '', content: '', description: '', photo: null, type: 'post' });
  };

  const handleAddComment = (postId) => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      text: newComment,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const updatedPost = { ...post, comments: [...(post.comments || []), comment] };
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(updatedPost);
        }
        return updatedPost;
      }
      return post;
    });

    setPosts(updatedPosts);
    setNewComment('');
  };

  const handleMarkerPress = (post) => {
    setSelectedPost(post);
    setSelectedBoardPost(null);
    setSelectedBoardPostBoardId(null);
    setViewModalVisible(true);
    const { latitudeDelta, longitudeDelta } = mapRegionRef.current;
    mapRef.current?.animateToRegion({
      latitude: post.coordinate.latitude,
      longitude: post.coordinate.longitude,
      latitudeDelta,
      longitudeDelta,
    }, 500);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const item = viewableItems[0].item;
      setSelectedPost(item);
      setSelectedBoardPost(null);
      setSelectedBoardPostBoardId(null);
      const { latitudeDelta, longitudeDelta } = mapRegionRef.current;
      mapRef.current?.animateToRegion({
        latitude: item.coordinate.latitude,
        longitude: item.coordinate.longitude,
        latitudeDelta,
        longitudeDelta,
      }, 500);
    }
  }).current;

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const filteredPosts = posts.filter(p => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return (
      p.title.toLowerCase().includes(keyword) ||
      (p.content && p.content.toLowerCase().includes(keyword)) ||
      (p.description && p.description.toLowerCase().includes(keyword))
    );
  });

  const selectedPostIndexInFiltered = selectedPost
    ? filteredPosts.findIndex(p => p.id === selectedPost.id)
    : 0;

  const safeInitialIndex = selectedPostIndexInFiltered >= 0 ? selectedPostIndexInFiltered : 0;

  const viewablePosts = filteredPosts;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleAddBoardPostComment = (boardId, boardPostId) => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedPosts = posts.map(p => {
      if (p.id === boardId) {
        const updatedBoardPosts = (p.boardPosts || []).map(bp => {
          if (bp.id === boardPostId) {
            const updatedBp = { ...bp, comments: [...(bp.comments || []), comment] };
            setSelectedBoardPost(updatedBp);
            return updatedBp;
          }
          return bp;
        });
        const updatedBoard = { ...p, boardPosts: updatedBoardPosts };
        setSelectedPost(updatedBoard);
        return updatedBoard;
      }
      return p;
    });

    setPosts(updatedPosts);
    setNewComment('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="스팟/스테이션 검색"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={handleMapPress}
        onRegionChangeComplete={(region) => {
          mapRegionRef.current = region;
        }}
        customMapStyle={customMapStyle}
      >
        {myLocation && (
          <Marker
            coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }}
            title="내 위치"
          />
        )}
        {otherUser && otherUser.lat && otherUser.lon && (
          <Marker
            coordinate={{ latitude: otherUser.lat, longitude: otherUser.lon }}
            title="상대방"
            pinColor="blue"
          />
        )}
        {filteredPosts.map(post => (
          <CustomMarker
            key={post.id}
            post={post}
            onPress={() => handleMarkerPress(post)}
          />
        ))}
      </MapView>

      {isAddingPost && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>지도를 터치하여 점을 추가할 위치를 선택하세요</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={() => {
          if (!myLocation) return;
          const { latitudeDelta, longitudeDelta } = mapRegionRef.current;
          mapRef.current?.animateToRegion(
            {
              latitude: myLocation.latitude,
              longitude: myLocation.longitude,
              latitudeDelta,
              longitudeDelta,
            },
            400
          );
        }}
      >
        <Ionicons name="locate" size={22} color="#0d6efd" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setIsAddingPost(!isAddingPost)}
      >
        <Ionicons name={isAddingPost ? "close" : "add"} size={22} color="white" />
      </TouchableOpacity>

      {/* 게시물 작성 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          handleBackNavigation();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{newPost.type === 'post' ? '새 스팟 남기기' : '새 스테이션 만들기'}</Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, newPost.type === 'post' && styles.typeButtonActive]}
                onPress={() => setNewPost({ ...newPost, type: 'post' })}
              >
                <Text style={[styles.typeButtonText, newPost.type === 'post' && styles.typeButtonTextActive]}>스팟</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, newPost.type === 'board' && styles.typeButtonActive]}
                onPress={() => setNewPost({ ...newPost, type: 'board' })}
              >
                <Text style={[styles.typeButtonText, newPost.type === 'board' && styles.typeButtonTextActive]}>스테이션</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="이모지 (예: 📍, 🍔, 📸)"
              value={newPost.emoji}
              onChangeText={(text) => setNewPost({ ...newPost, emoji: text })}
              maxLength={2}
            />
            
            <TextInput
              style={styles.input}
              placeholder={newPost.type === 'post' ? "간결한 제목" : "스테이션 이름"}
              value={newPost.title}
              onChangeText={(text) => setNewPost({ ...newPost, title: text })}
            />
            
            {newPost.type === 'post' ? (
              <>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="내용을 입력하세요"
                  value={newPost.content}
                  onChangeText={(text) => setNewPost({ ...newPost, content: text })}
                  multiline={true}
                  numberOfLines={4}
                />
                
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Text style={styles.photoButtonText}>{newPost.photo ? '사진 변경' : '사진 추가'}</Text>
                </TouchableOpacity>
                {newPost.photo && (
                  <Image source={{ uri: newPost.photo }} style={styles.previewImage} />
                )}
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="스테이션 설명을 입력하세요"
                  value={newPost.description}
                  onChangeText={(text) => setNewPost({ ...newPost, description: text })}
                  multiline={true}
                  numberOfLines={4}
                />
                
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Text style={styles.photoButtonText}>{newPost.photo ? '사진 변경' : '사진 추가'}</Text>
                </TouchableOpacity>
                {newPost.photo && (
                  <Image source={{ uri: newPost.photo }} style={styles.previewImage} />
                )}
              </>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSavePost}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 통합 보기 모달 (스와이핑) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={viewModalVisible}
        onRequestClose={() => {
          handleBackNavigation();
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <FlatList
            data={viewablePosts}
            extraData={posts}
            keyExtractor={item => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={safeInitialIndex}
            getItemLayout={(data, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <View style={{ width: screenWidth, justifyContent: 'center', alignItems: 'center' }}>
                <View style={[styles.viewModalContent, { maxHeight: '80%', width: '85%' }]}>
                  <View style={styles.swipeHintContainer}>
                    <Ionicons name="swap-horizontal" size={14} color="#8b8b8b" />
                    <Text style={styles.swipeHintText}>스와이프</Text>
                  </View>

                  {item.type === 'post' ? (
                    <>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.viewModalHeader}>
                          <Text style={styles.viewModalEmoji}>{item.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.viewModalTitle}>{item.title}</Text>
                            <CountdownTimer createdAt={item.createdAt} />
                          </View>
                        </View>
                        
                        {item.photo && (
                          <Image source={{ uri: item.photo }} style={styles.viewModalImage} resizeMode="cover" />
                        )}
                        
                        <Text style={styles.viewModalDescription}>{item.content}</Text>
                        
                        {/* 댓글 섹션 */}
                        <View style={styles.commentsSection}>
                          <Text style={styles.commentsTitle}>댓글</Text>
                          {(item.comments || []).map(comment => (
                            <View key={comment.id} style={styles.commentItem}>
                              <Text style={styles.commentText}>{comment.text}</Text>
                              <Text style={styles.commentTime}>{comment.createdAt}</Text>
                            </View>
                          ))}
                          {(item.comments || []).length === 0 && (
                            <Text style={styles.noCommentsText}>아직 댓글이 없습니다.</Text>
                          )}
                        </View>
                      </ScrollView>

                      <View style={styles.commentInputContainer}>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="댓글을 입력하세요..."
                          value={newComment}
                          onChangeText={setNewComment}
                        />
                        <TouchableOpacity style={styles.commentSubmitButton} onPress={() => handleAddComment(item.id)}>
                          <Ionicons name="send" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      {selectedBoardPost && selectedBoardPostBoardId === item.id ? (
                        <View style={styles.inlineBoardPostContainer}>
                          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 260 }}>
                            <View style={styles.viewModalHeader}>
                              <Text style={styles.viewModalEmoji}>{selectedBoardPost.emoji || '📝'}</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.viewModalTitle}>{selectedBoardPost.title}</Text>
                                <Text style={styles.timerText}>{new Date(selectedBoardPost.createdAt).toLocaleString()}</Text>
                              </View>
                            </View>

                            {selectedBoardPost.photo && (
                              <Image source={{ uri: selectedBoardPost.photo }} style={styles.viewModalImage} resizeMode="cover" />
                            )}

                            <Text style={styles.viewModalDescription}>{selectedBoardPost.content}</Text>

                            <View style={styles.commentsSection}>
                              <Text style={styles.commentsTitle}>댓글</Text>
                              {(selectedBoardPost.comments || []).map(comment => (
                                <View key={comment.id} style={styles.commentItem}>
                                  <Text style={styles.commentText}>{comment.text}</Text>
                                  <Text style={styles.commentTime}>{comment.createdAt}</Text>
                                </View>
                              ))}
                              {(selectedBoardPost.comments || []).length === 0 && (
                                <Text style={styles.noCommentsText}>아직 댓글이 없습니다.</Text>
                              )}
                            </View>
                          </ScrollView>

                          <View style={styles.commentInputContainer}>
                            <TextInput
                              style={styles.commentInput}
                              placeholder="댓글을 입력하세요..."
                              value={newComment}
                              onChangeText={setNewComment}
                            />
                            <TouchableOpacity
                              style={styles.commentSubmitButton}
                              onPress={() => handleAddBoardPostComment(item.id, selectedBoardPost.id)}
                            >
                              <Ionicons name="send" size={16} color="white" />
                            </TouchableOpacity>
                          </View>
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

                          {item.photo && (
                            <Image source={{ uri: item.photo }} style={styles.boardImage} resizeMode="cover" />
                          )}

                          <View style={styles.boardPostsContainer}>
                            <ScrollView
                              showsVerticalScrollIndicator={false}
                              nestedScrollEnabled
                            >
                              {(Array.isArray(item.boardPosts) ? item.boardPosts : []).map((bp) => (
                                <TouchableOpacity
                                  key={bp.id}
                                  style={styles.boardPostItem}
                                  onPress={() => {
                                    setSelectedBoardPost(bp);
                                    setSelectedBoardPostBoardId(item.id);
                                  }}
                                >
                                  <View style={styles.boardPostTitleRow}>
                                    <Text style={styles.boardPostEmoji}>{bp.emoji || '📝'}</Text>
                                    <Text style={styles.boardPostTitle}>{bp.title}</Text>
                                  </View>
                                  <Text style={styles.boardPostPreview} numberOfLines={1}>{bp.content}</Text>
                                  <Text style={styles.boardPostTime}>{new Date(bp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </TouchableOpacity>
                              ))}
                              {(Array.isArray(item.boardPosts) ? item.boardPosts : []).length === 0 && (
                                <Text style={styles.noCommentsText}>아직 게시물이 없습니다.</Text>
                              )}
                            </ScrollView>
                          </View>

                          <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={() => {
                              setTargetBoardId(item.id);
                              setAddBoardPostModalVisible(true);
                            }}>
                              <Text style={styles.buttonText}>글쓰기</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => {
                      if (selectedBoardPost && selectedBoardPostBoardId) {
                        setSelectedBoardPost(null);
                        setSelectedBoardPostBoardId(null);
                        setNewComment('');
                      } else {
                        setViewModalVisible(false);
                        setSelectedBoardPost(null);
                        setSelectedBoardPostBoardId(null);
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* 스테이션 내 게시물 작성 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addBoardPostModalVisible}
        onRequestClose={() => {
          handleBackNavigation();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>스테이션에 글쓰기</Text>

            <TextInput
              style={styles.input}
              placeholder="이모지 (예: 📝, 📣, 🍽️)"
              value={newBoardPost.emoji}
              onChangeText={(text) => setNewBoardPost({ ...newBoardPost, emoji: text })}
              maxLength={2}
            />
            
            <TextInput
              style={styles.input}
              placeholder="제목"
              value={newBoardPost.title}
              onChangeText={(text) => setNewBoardPost({ ...newBoardPost, title: text })}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="내용을 입력하세요"
              value={newBoardPost.content}
              onChangeText={(text) => setNewBoardPost({ ...newBoardPost, content: text })}
              multiline={true}
              numberOfLines={4}
            />
            
            <TouchableOpacity style={styles.photoButton} onPress={async () => {
              let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
              });
              if (!result.canceled) {
                setNewBoardPost({ ...newBoardPost, photo: result.assets[0].uri });
              }
            }}>
              <Text style={styles.photoButtonText}>{newBoardPost.photo ? '사진 변경' : '사진 추가'}</Text>
            </TouchableOpacity>
            {newBoardPost.photo && (
              <Image source={{ uri: newBoardPost.photo }} style={styles.previewImage} />
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => {
                setAddBoardPostModalVisible(false);
                setTargetBoardId(null);
                setNewBoardPost({ emoji: '📝', title: '', content: '', photo: null });
              }}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={() => {
                if (!newBoardPost.title || !newBoardPost.content) {
                  Alert.alert('오류', '제목과 내용을 입력해주세요.');
                  return;
                }
                if (!targetBoardId) {
                  Alert.alert('오류', '게시판을 다시 선택한 뒤 글쓰기를 시도해주세요.');
                  return;
                }
                const updatedPosts = posts.map(p => {
                  if (p.id === targetBoardId) {
                    const newBp = { ...newBoardPost, id: Date.now().toString(), createdAt: Date.now(), comments: [] };
                    const updatedBoard = { ...p, boardPosts: [newBp, ...(p.boardPosts || [])] };
                    setSelectedPost(updatedBoard);
                    return updatedBoard;
                  }
                  return p;
                });
                setPosts(updatedPosts);
                setAddBoardPostModalVisible(false);
                setNewBoardPost({ emoji: '📝', title: '', content: '', photo: null });
                setTargetBoardId(null);
              }}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
