import { useFocusEffect } from '@react-navigation/native';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { getSelectedProperty } from '@/api';
import type { PropertyInfo, PropertyInfoSection, PropertyInfoTab } from '@/api';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { RulesInfoSkeleton } from '@/components/Skeleton';
import { usePropertyInfo } from '@/lib/usePropertyInfo';

// Premium Markdown stylesheet
const markdownStyles = {
  body: { color: '#334155', fontSize: 17, lineHeight: 26 },
  strong: { fontWeight: '700' as const, color: '#0f172a' },
  paragraph: { marginTop: 0, marginBottom: 16 },
  heading2: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  blockquote: {
    backgroundColor: '#f8fafc',
    borderLeftColor: '#0284c7',
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  list_item: { marginBottom: 6 },
  bullet_list: { marginBottom: 16 },
  code_inline: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600' as const,
  },
};

function NavButton({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const containerStyle: StyleProp<ViewStyle> = isSelected
    ? navTabActiveStyle
    : pressed
      ? navTabPressedStyle
      : navTabDefaultStyle;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={containerStyle}>
      <Text style={isSelected ? navTabActiveLabelStyle : navTabDefaultLabelStyle} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionContent({ section }: { section: PropertyInfoSection }) {
  return (
    <View className="mb-4">
      {section.title ? (
        <Text className="mb-3 text-xl font-bold tracking-tight text-zinc-900">{section.title}</Text>
      ) : null}
      <Markdown style={markdownStyles}>{section.content}</Markdown>
    </View>
  );
}

function TabContent({ tab }: { tab: PropertyInfoTab }) {
  return (
    <View className="gap-6 pb-8">
      {tab.sections.map((section, idx) => (
        <View key={idx} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <SectionContent section={section} />
        </View>
      ))}
    </View>
  );
}

/** Fallback when tabs is empty (e.g. Clear Lake legacy data). */
function EmptyTabsContent({ info }: { info: PropertyInfo }) {
  const sections: { title: string; content: string }[] = [];

  sections.push({
    title: 'Property Overview',
    content: `**${info.name}**\n\n**Check-in:** ${info.check_in_time} \n**Check-out:** ${info.check_out_time}`,
  });

  if (info.check_in_instructions) {
    sections.push({ title: 'Check-in instructions', content: info.check_in_instructions });
  }
  if (info.check_out_instructions) {
    sections.push({ title: 'Check-out instructions', content: info.check_out_instructions });
  }
  if (info.notices) {
    sections.push({ title: 'Active Notices', content: `> ${info.notices}` });
  }
  if (info.wifi_network || info.wifi_password || info.door_code) {
    const parts: string[] = [];
    if (info.wifi_network) parts.push(`**Network:** \`${info.wifi_network}\``);
    if (info.wifi_password) parts.push(`**Password:** \`${info.wifi_password}\``);
    if (info.door_code) parts.push(`**Door code:** \`${info.door_code}\``);
    sections.push({ title: 'WiFi & Access', content: parts.join('\n\n') });
  }

  if (sections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center pt-20">
        <Text className="text-lg font-medium text-zinc-400">
          No property information available.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-6 pb-8">
      {sections.map((section, idx) => (
        <View key={idx} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <SectionContent section={section} />
        </View>
      ))}
    </View>
  );
}

export function RulesInfoScreen() {
  const property = getSelectedProperty();
  const { data: info, error, isLoading, mutate } = usePropertyInfo(property);

  const tabs = useMemo(() => info?.tabs ?? [], [info]);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
      } else {
        mutate();
      }
    }, [mutate])
  );

  const selectedTab = useMemo(
    () => tabs.find((t) => t.id === selectedTabId) ?? tabs[0] ?? null,
    [tabs, selectedTabId]
  );

  if (isLoading) {
    return (
      <KioskScreen title="Rules & info">
        <RulesInfoSkeleton />
      </KioskScreen>
    );
  }

  if (error || !info) {
    return (
      <KioskScreen title="Rules & info">
        <View className="mb-2 flex-1 items-center justify-center gap-6 px-6">
          <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Text className="text-2xl">⚠️</Text>
          </View>
          <Text className="text-center text-lg text-zinc-600">
            {error instanceof Error ? error.message : 'Failed to load property information.'}
          </Text>
          <Pressable
            onPress={() => mutate()}
            className="rounded-xl bg-brand px-8 py-4 shadow-sm active:opacity-90">
            <Text className="text-lg font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      </KioskScreen>
    );
  }

  const hasTabs = tabs.length > 0;

  return (
    <KioskScreen title="Rules & info">
      <View className="flex-1 flex-row">
        {/* Left nav - fixed master column */}
        <View className="w-64 flex-shrink-0 border-r border-zinc-200 pt-2">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            {hasTabs ? (
              <Fragment>
                {tabs.map((tab) => (
                  <NavButton
                    key={tab.id}
                    label={tab.title}
                    isSelected={selectedTab?.id === tab.id}
                    onPress={() => setSelectedTabId(tab.id)}
                  />
                ))}
              </Fragment>
            ) : (
              <View className="rounded-xl bg-brand px-4 py-4 shadow-sm">
                <Text className="text-base font-bold text-white">Info</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Right content - detail view */}
        <ScrollView
          style={{ flex: 1, minWidth: 0 }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ padding: 24, paddingTop: 16 }}>
          <View key={selectedTab?.id ?? 'empty'}>
            {hasTabs && selectedTab ? (
              <TabContent tab={selectedTab} />
            ) : (
              <EmptyTabsContent info={info} />
            )}
          </View>
        </ScrollView>
      </View>
    </KioskScreen>
  );
}

const navTabBase = {
  marginBottom: 10,
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 17,
} as const;

const navTabActiveStyle = {
  ...navTabBase,
  backgroundColor: '#1b1b52',
  shadowColor: '#1b1b52',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 3,
} as const;

const navTabDefaultStyle = {
  ...navTabBase,
  backgroundColor: '#f1f5f9',
} as const;

const navTabPressedStyle = {
  ...navTabBase,
  backgroundColor: '#e2e8f0',
} as const;

const navTabActiveLabelStyle = {
  fontSize: 16,
  fontWeight: '700' as const,
  color: '#ffffff',
} as const;

const navTabDefaultLabelStyle = {
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#475569',
} as const;
