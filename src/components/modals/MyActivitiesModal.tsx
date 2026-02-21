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
  mode: "stores" | "board";
  boardId?: string;
  boardTitle?: string;
  canReturnToStoreList: boolean;
  onSelectStore: (boardId: string, boardTitle: string) => void;
  onBackToStoreList: () => void;
};

type ParticipatedStoreSummary = {
  boardId: string;
  boardTitle: string;
  activityCount: number;
  lastActivityAt: number;
};

export const MyActivitiesModal = ({
  mode,
  boardId,
  boardTitle,
  canReturnToStoreList,
  onSelectStore,
  onBackToStoreList,
}: Props) => {
  const { myActivitiesModalVisible, setMyActivitiesModalVisible, participatedActivities } = useMapStore();
  const activities = [...participatedActivities].sort((a, b) => b.startedAt - a.startedAt);
  const filteredActivities = mode === "board" && boardId ? activities.filter((activity) => activity.boardId === boardId) : [];
  const participatedStores = activities.reduce<ParticipatedStoreSummary[]>((acc, activity) => {
    const existing = acc.find((item) => item.boardId === activity.boardId);
    if (existing) {
      existing.activityCount += 1;
      if (activity.startedAt > existing.lastActivityAt) {
        existing.lastActivityAt = activity.startedAt;
      }
      return acc;
    }

    acc.push({
      boardId: activity.boardId,
      boardTitle: activity.boardTitle,
      activityCount: 1,
      lastActivityAt: activity.startedAt,
    });
    return acc;
  }, []);
  participatedStores.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={myActivitiesModalVisible}
      onRequestClose={() => setMyActivitiesModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.activitiesModalView}>
          <Text style={styles.modalTitle}>
            {mode === "stores" ? "내가 참여한 가게" : `${boardTitle ?? "이 가게"} 활동 내역`}
          </Text>

          {mode === "stores" ? (
            participatedStores.length === 0 ? (
              <Text style={styles.noCommentsText}>아직 활동에 참여한 가게가 없습니다.</Text>
            ) : (
              <FlatList
                data={participatedStores}
                keyExtractor={(item) => item.boardId}
                style={styles.activitiesList}
                renderItem={({ item }) => (
                  <View style={styles.participatedStoreItem}>
                    <Text style={styles.participatedStoreTitle}>{item.boardTitle}</Text>
                    <Text style={styles.participatedStoreMeta}>참여 활동 수: {item.activityCount}회</Text>
                    <Text style={styles.participatedStoreMeta}>
                      최근 참여: {new Date(item.lastActivityAt).toLocaleString()}
                    </Text>
                    <View style={styles.participatedStoreActionRow}>
                      <TouchableOpacity
                        style={styles.participatedStoreButton}
                        onPress={() => onSelectStore(item.boardId, item.boardTitle)}
                      >
                        <Text style={styles.participatedStoreButtonText}>활동 내역 보기</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )
          ) : filteredActivities.length === 0 ? (
            <Text style={styles.noCommentsText}>이 가게에서 참여한 활동이 없습니다.</Text>
          ) : (
            <FlatList
              data={filteredActivities}
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
                </View>
              )}
            />
          )}

          <View style={styles.buttonContainer}>
            {mode === "board" && canReturnToStoreList ? (
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onBackToStoreList}>
                <Text style={styles.buttonText}>가게 목록</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setMyActivitiesModalVisible(false)}>
              <Text style={styles.buttonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
