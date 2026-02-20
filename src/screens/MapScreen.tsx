import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
  ViewabilityConfig,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { MapPressEvent, Marker, Region } from "react-native-maps";

import { AddBoardPostModal } from "../components/modals/AddBoardPostModal";
import { CreatePostModal } from "../components/modals/CreatePostModal";
import { ViewPostModal } from "../components/modals/ViewPostModal";
import { CustomMarker } from "../components/CustomMarker";
import { styles } from "../styles/globalStyles";
import { customMapStyle } from "../styles/mapStyles";
import { useMapStore } from "../store/useMapStore";
import { Post } from "../types/map";
import { INITIAL_REGION } from "../utils/constants";

export default function MapScreen() {
  const [myLocation, setMyLocation] = useState<Location.LocationObjectCoords | null>(null);

  const {
    posts,
    modalVisible,
    isAddingPost,
    selectedPost,
    viewModalVisible,
    searchQuery,
    selectedBoardPost,
    selectedBoardPostBoardId,
    addBoardPostModalVisible,
    setIsAddingPost,
    updateNewPostField,
    setSelectedPost,
    setViewModalVisible,
    setSearchQuery,
    setSelectedBoardPost,
    setSelectedBoardPostBoardId,
    handleBackNavigation,
    setModalVisible,
  } = useMapStore();

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const mapRegionRef = useRef<Region>(INITIAL_REGION);

  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한 필요", "위치 권한을 허용해주세요.");
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (loc) => {
          setMyLocation(loc.coords);
        },
      );
    };

    startTracking();

    return () => {
      locationSubscription.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBackPress = () => handleBackNavigation();
    const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);

    return () => subscription.remove();
  }, [selectedBoardPost, selectedBoardPostBoardId, addBoardPostModalVisible, viewModalVisible, modalVisible, handleBackNavigation]);

  const handleMapPress = (e: MapPressEvent) => {
    if (!isAddingPost) return;
    updateNewPostField("coordinate", e.nativeEvent.coordinate);
    setIsAddingPost(false);
    setModalVisible(true);
  };

  const handleMarkerPress = (post: Post) => {
    setSelectedPost(post);
    setSelectedBoardPost(null);
    setSelectedBoardPostBoardId(null);
    setViewModalVisible(true);
    const { latitudeDelta, longitudeDelta } = mapRegionRef.current;
    mapRef.current?.animateToRegion(
      {
        latitude: post.coordinate.latitude,
        longitude: post.coordinate.longitude,
        latitudeDelta,
        longitudeDelta,
      },
      500,
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken<Post>> }) => {
    const first = viewableItems[0]?.item;
    if (!first) return;
    setSelectedPost(first);
    setSelectedBoardPost(null);
    setSelectedBoardPostBoardId(null);
    const { latitudeDelta, longitudeDelta } = mapRegionRef.current;
    mapRef.current?.animateToRegion(
      {
        latitude: first.coordinate.latitude,
        longitude: first.coordinate.longitude,
        latitudeDelta,
        longitudeDelta,
      },
      500,
    );
  }).current;

  const filteredPosts = posts.filter((p) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    if (p.type === "post") {
      return p.title.toLowerCase().includes(keyword) || p.content.toLowerCase().includes(keyword);
    }
    return p.title.toLowerCase().includes(keyword) || p.description.toLowerCase().includes(keyword);
  });

  const selectedPostIndexInFiltered = selectedPost ? filteredPosts.findIndex((p) => p.id === selectedPost.id) : 0;
  const safeInitialIndex = selectedPostIndexInFiltered >= 0 ? selectedPostIndexInFiltered : 0;
  const viewablePosts = filteredPosts;
  const viewabilityConfig = useRef<ViewabilityConfig>({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="포스트/스테이션 검색"
          placeholderTextColor="#8b8b8b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
        onRegionChangeComplete={(region) => {
          mapRegionRef.current = region;
        }}
        customMapStyle={customMapStyle}
      >
        {myLocation && (
          <Marker coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }} title="내 위치" />
        )}
        {filteredPosts.map((post) => (
          <CustomMarker key={post.id} post={post} onPress={() => handleMarkerPress(post)} />
        ))}
      </MapView>

      {isAddingPost && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>지도를 탭해서 게시물 위치를 선택하세요.</Text>
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
            400,
          );
        }}
      >
        <Ionicons name="locate" size={22} color="#0d6efd" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} onPress={() => setIsAddingPost(!isAddingPost)}>
        <Ionicons name={isAddingPost ? "close" : "add"} size={22} color="white" />
      </TouchableOpacity>

      <CreatePostModal />

      <ViewPostModal
        viewablePosts={viewablePosts}
        safeInitialIndex={safeInitialIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <AddBoardPostModal />
    </View>
  );
}
