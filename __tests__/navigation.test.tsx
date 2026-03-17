import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppNavigator } from '@/components/navigation/AppNavigator';

jest.mock('@/lib/usePropertyInfo', () => ({
  usePropertyInfo: () => ({
    data: {
      property: 'tahoe',
      name: 'Test Property',
      content_format: 'markdown',
      check_in_time: '3:00 PM',
      check_out_time: '11:00 AM',
      check_in_instructions: null,
      check_out_instructions: null,
      notices: null,
      wifi_network: null,
      wifi_password: null,
      door_code: null,
      tabs: [{ id: 'overview', title: 'Overview', sections: [] }],
      rooms: [{ id: 'room1', name: 'Room 1' }],
      additional_settings: {},
    },
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  }),
}));

jest.mock('@/lib/useBookingsCalendar', () => ({
  useBookingsCalendar: () => ({
    data: {
      data: {},
      start_date: '2025-03-13',
      end_date: '2025-03-23',
    },
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  }),
}));

function renderApp() {
  return render(<AppNavigator />);
}

describe('App navigation', () => {
  it('starts at Landing screen', async () => {
    renderApp();
    expect(await screen.findByLabelText('Young Scandinavians Club logo')).toBeTruthy();
    expect(screen.getByText('Check in to cabin')).toBeTruthy();
    expect(screen.getByText('Rules & cabin info')).toBeTruthy();
    expect(screen.getByText(/Who I.m staying with/)).toBeTruthy();
  });

  it('navigates through all main flows', async () => {
    renderApp();

    // Check in flow
    fireEvent.press(screen.getByText('Check in to cabin'));
    expect(await screen.findByText('Check in')).toBeTruthy();
    expect(
      screen.getByText('Enter the last name on your booking to pull up your reservation.')
    ).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(await screen.findByLabelText('Young Scandinavians Club logo')).toBeTruthy();

    // Rules & info flow
    fireEvent.press(screen.getByText('Rules & cabin info'));
    expect(await screen.findByText('Rules & info')).toBeTruthy();
    expect(screen.getByText('Overview')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(await screen.findByLabelText('Young Scandinavians Club logo')).toBeTruthy();

    // Group flow
    fireEvent.press(screen.getByText(/Who I.m staying with/));
    expect(await screen.findByText(/Who I.m staying with/)).toBeTruthy();
    expect(screen.getByText('Full Buyout')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Go back'));
    expect(await screen.findByLabelText('Young Scandinavians Club logo')).toBeTruthy();
  });

  it('preserves back navigation stack', async () => {
    renderApp();

    fireEvent.press(screen.getByText('Check in to cabin'));
    await screen.findByText('Enter the last name on your booking to pull up your reservation.');
    fireEvent.press(screen.getByLabelText('Go back'));

    fireEvent.press(screen.getByText('Rules & cabin info'));
    await screen.findByText('Overview');
    fireEvent.press(screen.getByLabelText('Go back'));

    // Should be back at landing
    expect(screen.getByLabelText('Young Scandinavians Club logo')).toBeTruthy();
  });
});
