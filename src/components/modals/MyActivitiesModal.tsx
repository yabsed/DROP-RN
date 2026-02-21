import React from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/globalStyles";
import { useMapStore } from "../../store/useMapStore";
import { MissionType } from "../../types/map";

const getMissionTypeLabel = (missionType: MissionType): string => {
  if (missionType === "quiet_time_visit") return "한산 시간 방문 인증";
  if (missionType === "repeat_visit_stamp") return "반복 방문 스탬프";
  return "체류 시간 인증";
};

const formatCoordinate = (latitude?: number, longitude?: number): string => {
  if (latitude === undefined || longitude === undefined) return "-";
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

type Props = {
  onFocusBoard: (boardId: string) => void;
};

export const MyActivitiesModal = ({ onFocusBoard }: Props) => {
  const { myActivitiesModalVisible, setMyActivitiesModalVisible, participatedActivities } = useMapStore();
  const activities = [...participatedActivities].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={myActivitiesModalVisible}
      onRequestClose={() => setMyActivitiesModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.activitiesModalView}>
          <Text style={styles.modalTitle}>내가 참여한 활동</Text>

          {activities.length === 0 ? (
            <Text style={styles.noCommentsText}>아직 참여한 활동이 없습니다.</Text>
          ) : (
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id}
              style={styles.activitiesList}
              renderItem={({ item }) => (
                <View style={styles.activityItem}>
                  <View style={styles.activityHeaderRow}>
                    <Text style={styles.activityTitle}>
                      {item.boardTitle} · {item.missionTitle}
                    </Text>
                    <View
                      style={[
                        styles.activityStatusBadge,
                        item.status === "completed" ? styles.activityStatusCompleted : styles.activityStatusStarted,
                      ]}
                    >
                      <Text style={styles.activityStatusText}>
                        {item.status === "completed" ? "완료" : "진행중"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.activityMetaText}>유형: {getMissionTypeLabel(item.missionType)}</Text>
                  <Text style={styles.activityMetaText}>
                    보상: {item.rewardCoins > 0 ? `+${item.rewardCoins} 코인` : "스탬프 적립"}
                  </Text>
                  <Text style={styles.activityMetaText}>
                    시작: {new Date(item.startedAt).toLocaleString()}
                  </Text>
                  <Text style={styles.activityMetaText}>
                    시작 GPS: {formatCoordinate(item.startCoordinate.latitude, item.startCoordinate.longitude)}
                  </Text>
                  {item.completedAt ? (
                    <Text style={styles.activityMetaText}>종료: {new Date(item.completedAt).toLocaleString()}</Text>
                  ) : null}
                  {item.endCoordinate ? (
                    <Text style={styles.activityMetaText}>
                      종료 GPS: {formatCoordinate(item.endCoordinate.latitude, item.endCoordinate.longitude)}
                    </Text>
                  ) : null}
                  <View style={styles.activityActionRow}>
                    <TouchableOpacity style={styles.activityFocusButton} onPress={() => onFocusBoard(item.boardId)}>
                      <Text style={styles.activityFocusButtonText}>이 가게로 포커스</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setMyActivitiesModalVisible(false)}>
              <Text style={styles.buttonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
