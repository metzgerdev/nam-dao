module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.jsx"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
