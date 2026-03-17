import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { RootStackParamList } from '@/components/navigation/types';
import { LandingScreen } from '@/components/screens/LandingScreen';
import { RulesInfoScreen } from '@/components/screens/RulesInfoScreen';
import { usePropertyInfo } from '@/lib/usePropertyInfo';

const mockPropertyInfo = {
  property: 'tahoe' as const,
  name: 'Lake Tahoe Cabin',
  content_format: 'markdown' as const,
  check_in_time: '3:00 PM',
  check_out_time: '11:00 AM',
  check_in_instructions: 'Use the lockbox at the front door. Code is 1234.',
  check_out_instructions: 'Leave keys in the lockbox and strip the beds.',
  notices: 'Quiet hours 10 PM - 8 AM.',
  wifi_network: 'TahoeGuest',
  wifi_password: 'welcome123',
  door_code: '5678',
  tabs: [
    {
      id: 'welcome',
      title: 'Welcome',
      sections: [
        {
          title: 'TL;DR',
          content:
            '**Wi-Fi:** Welcome2024! | **Payment** required before arrival | Bring your own linens & towels',
        },
        {
          title: 'Wi-Fi Password',
          content: '**Network:** YSC-Tahoe\n\n**Password:** Welcome2024!',
        },
      ],
    },
    {
      id: 'pets',
      title: 'Pet Policy',
      sections: [
        { title: 'Dogs', content: 'Dogs are welcome with a $50 pet fee.' },
        { title: 'Cats', content: 'Cats are not allowed.' },
      ],
    },
    {
      id: 'parking',
      title: 'Parking',
      sections: [{ title: '', content: 'Park in designated spots only. Max 2 vehicles.' }],
    },
  ],
  additional_settings: {},
};

const mockPropertyInfoMinimal = {
  property: 'tahoe' as const,
  name: 'Minimal Property',
  content_format: 'markdown' as const,
  check_in_time: '4:00 PM',
  check_out_time: '10:00 AM',
  check_in_instructions: null,
  check_out_instructions: null,
  notices: null,
  wifi_network: null,
  wifi_password: null,
  door_code: null,
  tabs: [] as const,
  additional_settings: {},
};

const mockPropertyInfoEmptyTabs = {
  ...mockPropertyInfoMinimal,
  name: 'Clear Lake Property',
  check_in_instructions: 'Check in at the office.',
  check_out_instructions: 'Leave keys at the front desk.',
  notices: 'Pool closes at 10 PM.',
  wifi_network: 'ClearLakeGuest',
  wifi_password: 'lake123',
  door_code: '9999',
};

jest.mock('@/lib/usePropertyInfo', () => ({
  usePropertyInfo: jest.fn(),
}));

const Stack = createNativeStackNavigator<RootStackParamList>();

function renderRulesInfo() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="RulesInfo" component={RulesInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('RulesInfoScreen', () => {
  beforeEach(() => {
    (usePropertyInfo as jest.Mock).mockReturnValue({
      data: mockPropertyInfo,
      error: null,
      isLoading: false,
      mutate: jest.fn(),
    });
  });

  describe('loading state', () => {
    it('shows skeleton when loading', () => {
      (usePropertyInfo as jest.Mock).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        mutate: jest.fn(),
      });

      render(
        <NavigationContainer>
          <Stack.Navigator initialRouteName="RulesInfo" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RulesInfo" component={RulesInfoScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      );

      expect(screen.getByText('Rules & info')).toBeTruthy();
      expect(screen.queryByText('Welcome')).toBeNull();
    });
  });

  describe('error state', () => {
    it('shows error message when API fails', () => {
      (usePropertyInfo as jest.Mock).mockReturnValue({
        data: undefined,
        error: new Error('Network request failed'),
        isLoading: false,
        mutate: jest.fn(),
      });

      render(
        <NavigationContainer>
          <Stack.Navigator initialRouteName="RulesInfo" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RulesInfo" component={RulesInfoScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      );

      expect(screen.getByText('Rules & info')).toBeTruthy();
      expect(screen.getByText('Network request failed')).toBeTruthy();
    });

    it('shows generic error when error is not an Error instance', () => {
      (usePropertyInfo as jest.Mock).mockReturnValue({
        data: undefined,
        error: 'string error',
        isLoading: false,
        mutate: jest.fn(),
      });

      render(
        <NavigationContainer>
          <Stack.Navigator initialRouteName="RulesInfo" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RulesInfo" component={RulesInfoScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      );

      expect(screen.getByText('Failed to load property information.')).toBeTruthy();
    });
  });

  describe('success state with tabs', () => {
    it('renders split view with tab navigation and content', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));

      expect(await screen.findByText('Rules & info')).toBeTruthy();
      expect(screen.getByText('Welcome')).toBeTruthy();
      expect(screen.getByText('TL;DR')).toBeTruthy();
    });

    it('renders all tab nav items from API', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));

      await screen.findByText('Welcome');
      expect(screen.getByText('Welcome')).toBeTruthy();
      expect(screen.getByText('Pet Policy')).toBeTruthy();
      expect(screen.getByText('Parking')).toBeTruthy();
    });

    it('shows first tab content by default', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));

      await screen.findByText('TL;DR');
      expect(screen.getByText('Wi-Fi Password')).toBeTruthy();
      expect(screen.getByText('YSC-Tahoe')).toBeTruthy();
      expect(screen.getByText('Welcome2024!')).toBeTruthy();
    });

    it('switches to Pet Policy content when Pet Policy tab is pressed', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));
      await screen.findByText('Welcome');

      fireEvent.press(screen.getByText('Pet Policy'));
      expect(screen.getByText('Dogs')).toBeTruthy();
      expect(screen.getByText('Dogs are welcome with a $50 pet fee.')).toBeTruthy();
      expect(screen.getByText('Cats')).toBeTruthy();
      expect(screen.getByText('Cats are not allowed.')).toBeTruthy();
    });

    it('switches to Parking content when Parking tab is pressed', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));
      await screen.findByText('Welcome');

      fireEvent.press(screen.getByText('Parking'));
      expect(screen.getByText('Park in designated spots only. Max 2 vehicles.')).toBeTruthy();
    });

    it('renders markdown section content', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));
      await screen.findByText('Welcome');

      // Section content is rendered via Markdown (Welcome2024! appears in Wi-Fi Password section)
      expect(screen.getByText('Welcome2024!')).toBeTruthy();
    });

    it('renders back button', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));
      expect(await screen.findByLabelText('Go back')).toBeTruthy();
    });

    it('navigates back when back button is pressed', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));
      await screen.findByText('Welcome');

      fireEvent.press(screen.getByLabelText('Go back'));
      expect(screen.getByLabelText('Young Scandinavians Club logo')).toBeTruthy();
    });
  });

  describe('empty tabs (e.g. Clear Lake)', () => {
    beforeEach(() => {
      (usePropertyInfo as jest.Mock).mockReturnValue({
        data: mockPropertyInfoEmptyTabs,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      });
    });

    it('shows Info nav and fallback content with check-in/out instructions', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));

      await screen.findByText('Info');
      expect(screen.getByText('Clear Lake Property')).toBeTruthy();
      expect(screen.getByText('Check in at the office.')).toBeTruthy();
      expect(screen.getByText('Leave keys at the front desk.')).toBeTruthy();
      expect(screen.getByText('Pool closes at 10 PM.')).toBeTruthy();
      expect(screen.getByText('ClearLakeGuest')).toBeTruthy();
      expect(screen.getByText('lake123')).toBeTruthy();
      expect(screen.getByText('9999')).toBeTruthy();
    });
  });

  describe('minimal content (all null)', () => {
    beforeEach(() => {
      (usePropertyInfo as jest.Mock).mockReturnValue({
        data: mockPropertyInfoMinimal,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      });
    });

    it('shows placeholder when tabs empty and no instructions', async () => {
      renderRulesInfo();
      fireEvent.press(screen.getByText('Rules & info'));

      await screen.findByText('Info');
      expect(screen.getByText('Minimal Property')).toBeTruthy();
      // Check-in/out times rendered in markdown (may be in same text node)
      expect(screen.getByText(/4:00 PM/)).toBeTruthy();
      expect(screen.getByText(/10:00 AM/)).toBeTruthy();
    });
  });
});
