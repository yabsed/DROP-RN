import Constants from 'expo-constants';

// Expo Go에서 실행 중인 로컬 PC의 IP 주소를 자동으로 가져옵니다.
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
export const SERVER_URL = `http://${localhost}:3000`;

export const INITIAL_REGION = {
  latitude: 37.471,
  longitude: 126.935,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};
