import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { styles } from '../styles/globalStyles';

// 이모지 마커가 안 보이는 현상과 깜빡임을 동시에 해결하기 위한 커스텀 마커 컴포넌트
export const CustomMarker = ({ post, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // 처음 렌더링 시에는 tracksViewChanges를 true로 두어 이모지가 정상적으로 그려지게 하고,
    // 500ms 후에 false로 변경하여 지도를 움직일 때 깜빡이는 현상을 방지합니다.
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={post.coordinate}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.markerContainer}>
        <Text style={styles.emojiMarker}>{post.emoji}</Text>
      </View>
    </Marker>
  );
};
