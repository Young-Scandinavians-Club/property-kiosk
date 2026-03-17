# YSC Property Kiosk

A React Native (Expo) kiosk app for property check-in at Young Scandinavians Club (YSC) locations. Guests use the kiosk to check in, view rules, and manage group bookings for Tahoe and Clear Lake properties.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Expo Go** (for quick testing on a physical device) or **Xcode** / **Android Studio** (for simulators and native builds)
- **iOS Simulator** or **Android Emulator** (optional, for local development)

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd property-kiosk
npm install
```

### 2. Configure the API

The app needs an API key to talk to the YSC booking backend. You can configure it in one of two ways:

**Option A: Environment variables** (recommended for development)

Create a `.env` file in the project root (or export these in your shell):

```bash
EXPO_PUBLIC_KIOSK_API_KEY=dev-kiosk-key
EXPO_PUBLIC_API_ENVIRONMENT=local   # or: sandbox | prod
```

- `EXPO_PUBLIC_KIOSK_API_KEY` (or `KIOSK_API_KEY`) — required
- `EXPO_PUBLIC_API_ENVIRONMENT` — `local` | `sandbox` | `prod` (default: `local`)
- `EXPO_PUBLIC_API_BASE_URL` — optional override for a custom base URL

**Option B: In-app setup**

If no API key is set, the app shows an **ApiKeySetupScreen** on first launch. Enter the API key, choose environment (Local / Sandbox / Production), and property (Tahoe / Clear Lake). Config is stored securely via `expo-secure-store`.

**Dev API key:** Use `dev-kiosk-key` for sandbox, local, or prod testing. See [docs/API_TESTING.md](docs/API_TESTING.md).

### 3. Start the app

```bash
npm start
```

Then:

- Press **`a`** for Android emulator
- Press **`i`** for iOS simulator
- Press **`w`** for web
- Scan the QR code with Expo Go on a physical device

### 4. Local backend (optional)

For `local` environment, the app expects the backend at:

- **iOS Simulator:** `http://localhost:4000`
- **Android Emulator:** `http://10.0.2.2:4000` (host machine)

Run the YSC backend locally on port 4000 if you want to test against it.

## Project Structure

```
property-kiosk/
├── api/                 # API client, config, types
├── components/
│   ├── navigation/      # App navigator, screens
│   └── screens/         # Landing, CheckIn, RulesInfo, Group, ApiKeySetup
├── lib/                 # Hooks, storage, utils (usePropertyInfo, apiStorage, etc.)
├── assets/              # Images, icons, vehicle SVGs
├── docs/                # API_TESTING.md, VEHICLE_DATA_DEBUG.md
├── __tests__/           # Jest tests
└── App.tsx              # Entry point
```

**Path alias:** `@/` maps to the project root (e.g. `@/components/screens/LandingScreen`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run web` | Run in web browser |
| `npm run android` | Run on Android (native build) |
| `npm run ios` | Run on iOS (native build) |
| `npm run prebuild` | Generate native `ios/` and `android/` folders |
| `npm run lint` | Run ESLint + Prettier check |
| `npm run format` | Fix ESLint + Prettier |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:ci` | Jest for CI |

## Testing

```bash
npm test
```

Tests use Jest with `jest-expo` and `@testing-library/react-native`. See `__tests__/` for screen, navigation, and API tests.

## Build

For native builds:

```bash
npm run prebuild   # Generates ios/ and android/
npm run ios        # Build and run on iOS
npm run android    # Build and run on Android
```

## Tech Stack

- **Expo** 54
- **React Native** 0.81, **React** 19
- **TypeScript** (strict mode)
- **NativeWind** (Tailwind CSS for React Native)
- **React Navigation** (native stack)
- **SWR** for data fetching
- **expo-secure-store** for API config storage

## Environment Reference

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_KIOSK_API_KEY` | Kiosk API key (required) |
| `KIOSK_API_KEY` | Alternative to `EXPO_PUBLIC_KIOSK_API_KEY` |
| `EXPO_PUBLIC_API_ENVIRONMENT` | `local` \| `sandbox` \| `prod` |
| `EXPO_PUBLIC_API_BASE_URL` | Custom API base URL override |

## Further Reading

- [docs/API_TESTING.md](docs/API_TESTING.md) — API key and testing
- [docs/VEHICLE_DATA_DEBUG.md](docs/VEHICLE_DATA_DEBUG.md) — Vehicle data structure from the backend
