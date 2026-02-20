import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Alert, Modal, TextInput, Button, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import Constants from 'expo-constants';

// Expo Go에서 실행 중인 로컬 PC의 IP 주소를 자동으로 가져옵니다.
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const SERVER_URL = `http://${localhost}:3000`;

export default function App() {
  const [myLocation, setMyLocation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  
  // 게시물(점) 관련 상태
  const [posts, setPosts] = useState([
    { id: 'd1', coordinate: { latitude: 37.471, longitude: 126.935 }, emoji: '🍔', title: '맛있는 버거집', content: '여기 수제버거 진짜 맛있어요!', comments: [] },
    { id: 'd2', coordinate: { latitude: 37.469, longitude: 126.933 }, emoji: '☕', title: '조용한 카페', content: '공부하기 좋은 카페입니다.', comments: [] },
    { id: 'd3', coordinate: { latitude: 37.472, longitude: 126.936 }, emoji: '📚', title: '스터디룸', content: '시설 깔끔하고 좋아요.', comments: [] },
    { id: 'd4', coordinate: { latitude: 37.468, longitude: 126.934 }, emoji: '🍜', title: '가성비 라면', content: '혼밥하기 딱 좋은 곳', comments: [] },
    { id: 'd5', coordinate: { latitude: 37.470, longitude: 126.937 }, emoji: '🌳', title: '산책로', content: '밥 먹고 걷기 좋아요.', comments: [] },
    { id: 'd6', coordinate: { latitude: 37.473, longitude: 126.932 }, emoji: '🛒', title: '할인 마트', content: '생필품 싸게 파는 곳', comments: [] },
    { id: 'd7', coordinate: { latitude: 37.467, longitude: 126.938 }, emoji: '🏋️', title: '헬스장', content: '기구 많고 넓어요.', comments: [] },
    { id: 'd8', coordinate: { latitude: 37.474, longitude: 126.935 }, emoji: '🍕', title: '피자 맛집', content: '치즈가 듬뿍 들어있어요.', comments: [] },
    { id: 'd9', coordinate: { latitude: 37.471, longitude: 126.931 }, emoji: '🍺', title: '분위기 좋은 펍', content: '맥주 한잔하기 좋은 곳', comments: [] },
    { id: 'd10', coordinate: { latitude: 37.469, longitude: 126.939 }, emoji: '🍦', title: '아이스크림 가게', content: '디저트로 최고!', comments: [] },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [newPost, setNewPost] = useState({ coordinate: null, emoji: '📍', title: '', content: '', photo: null });
  
  // 선택된 게시물 보기 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');

  const socketRef = useRef(null);
  const locationSubscription = useRef(null);

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
    if (!newPost.title || !newPost.content) {
      Alert.alert('오류', '제목과 내용을 입력해주세요.');
      return;
    }
    setPosts([...posts, { ...newPost, id: Date.now().toString(), comments: [] }]);
    setModalVisible(false);
    setNewPost({ coordinate: null, emoji: '📍', title: '', content: '', photo: null });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      text: newComment,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedPosts = posts.map(post => {
      if (post.id === selectedPost.id) {
        const updatedPost = { ...post, comments: [...(post.comments || []), comment] };
        setSelectedPost(updatedPost);
        return updatedPost;
      }
      return post;
    });

    setPosts(updatedPosts);
    setNewComment('');
  };

  const handleMarkerPress = (post) => {
    setSelectedPost(post);
    setViewModalVisible(true);
  };

  // 심플한 지도 스타일 (구글 맵 기준)
  const customMapStyle = [
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#616161" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#f5f5f5" }]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#bdbdbd" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#eeeeee" }]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "color": "#e5e5e5" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9e9e9e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#ffffff" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{ "color": "#dadada" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#616161" }]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9e9e9e" }]
    },
    {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [{ "color": "#e5e5e5" }]
    },
    {
      "featureType": "transit.station",
      "elementType": "geometry",
      "stylers": [{ "color": "#eeeeee" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#c9c9c9" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9e9e9e" }]
    }
  ];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.471,
          longitude: 126.935,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        onPress={handleMapPress}
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
        {posts.map(post => (
          <Marker
            key={post.id}
            coordinate={post.coordinate}
            onPress={() => handleMarkerPress(post)}
          >
            <Text style={styles.emojiMarker}>{post.emoji}</Text>
          </Marker>
        ))}
      </MapView>

      {isAddingPost && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>지도를 터치하여 점을 추가할 위치를 선택하세요</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => setIsAddingPost(!isAddingPost)}
      >
        <Ionicons name={isAddingPost ? "close" : "add"} size={30} color="white" />
      </TouchableOpacity>

      {/* 게시물 작성 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>새 게시물 남기기</Text>
            
            <TextInput
              style={styles.input}
              placeholder="이모지 (예: 📍, 🍔, 📸)"
              value={newPost.emoji}
              onChangeText={(text) => setNewPost({ ...newPost, emoji: text })}
              maxLength={2}
            />
            
            <TextInput
              style={styles.input}
              placeholder="간결한 제목"
              value={newPost.title}
              onChangeText={(text) => setNewPost({ ...newPost, title: text })}
            />
            
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

      {/* 게시물 보기 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={viewModalVisible}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[styles.viewModalContent, { maxHeight: '80%' }]}>
            {selectedPost && (
              <>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.viewModalHeader}>
                    <Text style={styles.viewModalEmoji}>{selectedPost.emoji}</Text>
                    <Text style={styles.viewModalTitle}>{selectedPost.title}</Text>
                  </View>
                  
                  {selectedPost.photo && (
                    <Image source={{ uri: selectedPost.photo }} style={styles.viewModalImage} resizeMode="cover" />
                  )}
                  
                  <Text style={styles.viewModalDescription}>{selectedPost.content}</Text>
                  
                  {/* 댓글 섹션 */}
                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>댓글</Text>
                    {(selectedPost.comments || []).map(comment => (
                      <View key={comment.id} style={styles.commentItem}>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <Text style={styles.commentTime}>{comment.createdAt}</Text>
                      </View>
                    ))}
                    {(selectedPost.comments || []).length === 0 && (
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
                  <TouchableOpacity style={styles.commentSubmitButton} onPress={handleAddComment}>
                    <Ionicons name="send" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setViewModalVisible(false)}
                >
                  <Text style={styles.buttonText}>닫기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
  map: { ...StyleSheet.absoluteFillObject },
  emojiMarker: {
    fontSize: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  instructionBanner: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 10,
  },
  instructionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  photoButton: {
    backgroundColor: '#E9ECEF',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoButtonText: {
    color: '#495057',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
  },
  viewModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  viewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  viewModalEmoji: {
    fontSize: 30,
    marginRight: 10,
  },
  viewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  viewModalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  viewModalDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  commentsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  noCommentsText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  commentSubmitButton: {
    backgroundColor: '#007BFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
});