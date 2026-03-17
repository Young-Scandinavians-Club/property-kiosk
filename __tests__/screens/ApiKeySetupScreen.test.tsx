import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { setApiConfig, setSelectedProperty } from '@/api';
import { ApiKeySetupScreen } from '@/components/screens/ApiKeySetupScreen';
import { saveStoredApiConfig } from '@/lib/apiStorage';

jest.mock('@/lib/apiStorage', () => ({
  saveStoredApiConfig: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/api', () => ({
  setApiConfig: jest.fn(),
  setSelectedProperty: jest.fn(),
}));

function renderApiKeySetup() {
  const onConfigured = jest.fn();
  render(<ApiKeySetupScreen onConfigured={onConfigured} />);
  return { onConfigured };
}

describe('ApiKeySetupScreen', () => {
  beforeEach(() => {
    jest.mocked(saveStoredApiConfig).mockClear();
    jest.mocked(saveStoredApiConfig).mockResolvedValue(undefined);
  });

  it('renders the Configure API title', () => {
    renderApiKeySetup();
    expect(screen.getByText('Configure API')).toBeTruthy();
  });

  it('renders the description text', () => {
    renderApiKeySetup();
    expect(
      screen.getByText('Enter the kiosk API key to connect to the booking system.')
    ).toBeTruthy();
  });

  it('renders the API key input with placeholder', () => {
    renderApiKeySetup();
    expect(screen.getByPlaceholderText('Enter API key')).toBeTruthy();
  });

  it('renders all environment options', () => {
    renderApiKeySetup();
    expect(screen.getByText('Local')).toBeTruthy();
    expect(screen.getByText('Sandbox')).toBeTruthy();
    expect(screen.getByText('Production')).toBeTruthy();
  });

  it('renders all property options', () => {
    renderApiKeySetup();
    expect(screen.getByText('Tahoe')).toBeTruthy();
    expect(screen.getByText('Clear Lake')).toBeTruthy();
  });

  it('renders the Save & continue button', () => {
    renderApiKeySetup();
    expect(screen.getByText('Save & continue')).toBeTruthy();
  });

  it('renders the YSC logo', () => {
    renderApiKeySetup();
    expect(screen.getByLabelText('YSC logo')).toBeTruthy();
  });

  it('shows error when Save is pressed with empty API key', async () => {
    renderApiKeySetup();
    fireEvent.press(screen.getByText('Save & continue'));

    expect(await screen.findByText('Please enter an API key.')).toBeTruthy();
    expect(saveStoredApiConfig).not.toHaveBeenCalled();
  });

  it('shows error when Save is pressed with whitespace-only API key', async () => {
    renderApiKeySetup();
    fireEvent.changeText(screen.getByPlaceholderText('Enter API key'), '   ');
    fireEvent.press(screen.getByText('Save & continue'));

    expect(await screen.findByText('Please enter an API key.')).toBeTruthy();
    expect(saveStoredApiConfig).not.toHaveBeenCalled();
  });

  it('clears error when user types in API key field after validation error', async () => {
    renderApiKeySetup();
    fireEvent.press(screen.getByText('Save & continue'));
    expect(await screen.findByText('Please enter an API key.')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Enter API key'), 'my-key');
    expect(screen.queryByText('Please enter an API key.')).toBeNull();
  });

  it('calls saveStoredApiConfig and onConfigured when Save succeeds with valid key', async () => {
    const { onConfigured } = renderApiKeySetup();
    const input = screen.getByPlaceholderText('Enter API key');
    fireEvent.changeText(input, 'test-api-key-123');
    fireEvent.press(screen.getByText('Save & continue'));

    await waitFor(() => expect(saveStoredApiConfig).toHaveBeenCalled(), { timeout: 2000 });
    expect(saveStoredApiConfig).toHaveBeenLastCalledWith({
      apiKey: 'test-api-key-123',
      environment: 'local',
      property: 'tahoe',
    });
    expect(setApiConfig).toHaveBeenCalledWith({
      environment: 'local',
      apiKey: 'test-api-key-123',
    });
    expect(setSelectedProperty).toHaveBeenCalledWith('tahoe');
    expect(onConfigured).toHaveBeenCalled();
  });

  it('trims whitespace from API key before saving', async () => {
    renderApiKeySetup();
    fireEvent.changeText(screen.getByPlaceholderText('Enter API key'), '  trimmed-key  ');
    fireEvent.press(screen.getByText('Save & continue'));

    await waitFor(() => expect(saveStoredApiConfig).toHaveBeenCalled(), { timeout: 2000 });
    expect(saveStoredApiConfig).toHaveBeenLastCalledWith({
      apiKey: 'trimmed-key',
      environment: 'local',
      property: 'tahoe',
    });
  });

  it('saves with Sandbox environment when Sandbox is selected', async () => {
    renderApiKeySetup();
    fireEvent.changeText(screen.getByPlaceholderText('Enter API key'), 'my-key');
    fireEvent.press(screen.getByText('Sandbox'));
    fireEvent.press(screen.getByText('Save & continue'));

    await waitFor(() => expect(saveStoredApiConfig).toHaveBeenCalled(), { timeout: 2000 });
    expect(saveStoredApiConfig).toHaveBeenLastCalledWith({
      apiKey: 'my-key',
      environment: 'sandbox',
      property: 'tahoe',
    });
  });

  it('saves with Clear Lake property when Clear Lake is selected', async () => {
    renderApiKeySetup();
    fireEvent.changeText(screen.getByPlaceholderText('Enter API key'), 'my-key');
    fireEvent.press(screen.getByText('Clear Lake'));
    fireEvent.press(screen.getByText('Save & continue'));

    await waitFor(() => expect(saveStoredApiConfig).toHaveBeenCalled(), { timeout: 2000 });
    expect(saveStoredApiConfig).toHaveBeenLastCalledWith({
      apiKey: 'my-key',
      environment: 'local',
      property: 'clear_lake',
    });
    expect(setSelectedProperty).toHaveBeenCalledWith('clear_lake');
  });

  it('saves with Production environment when Production is selected', async () => {
    renderApiKeySetup();
    fireEvent.changeText(screen.getByPlaceholderText('Enter API key'), 'my-key');
    fireEvent.press(screen.getByText('Production'));
    fireEvent.press(screen.getByText('Save & continue'));

    await waitFor(() => expect(saveStoredApiConfig).toHaveBeenCalled(), { timeout: 2000 });
    expect(saveStoredApiConfig).toHaveBeenLastCalledWith({
      apiKey: 'my-key',
      environment: 'prod',
      property: 'tahoe',
    });
  });

  it('shows error when saveStoredApiConfig throws', async () => {
    jest.mocked(saveStoredApiConfig).mockRejectedValue(new Error('Storage failed'));

    renderApiKeySetup();
    fireEvent.changeText(screen.getByPlaceholderText('Enter API key'), 'my-key');
    fireEvent.press(screen.getByText('Save & continue'));

    expect(await screen.findByText('Failed to save. Please try again.')).toBeTruthy();
  });
});
