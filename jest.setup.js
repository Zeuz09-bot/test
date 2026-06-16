// Mock native modules that aren't available in test environment
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    getBoolean: jest.fn(() => false),
    remove: jest.fn(),
  })),
}));
