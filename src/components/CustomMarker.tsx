import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { styles } from "../styles/globalStyles";
import { Post } from "../types/map";

type Props = {
  post: Post;
  onPress: () => void;
};

export const CustomMarker = ({ post, onPress }: Props) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker coordinate={post.coordinate} onPress={onPress} tracksViewChanges={tracksViewChanges}>
      <View style={styles.markerContainer}>
        <Text style={styles.emojiMarker}>{post.emoji}</Text>
      </View>
    </Marker>
  );
};
