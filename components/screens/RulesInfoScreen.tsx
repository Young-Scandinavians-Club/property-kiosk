import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

import type { PropertyInfo, PropertyInfoSection, PropertyInfoTab } from '@/api';
import { KioskScreen } from '@/components/screens/KioskScreen';
import { RulesInfoSkeleton } from '@/components/Skeleton';
import { usePropertyInfo } from '@/lib/usePropertyInfo';

function SectionContent({ section }: { section: PropertyInfoSection }) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-lg font-semibold text-gray-900">{section.title}</Text>
      <Markdown
        style={{
          body: { color: '#374151', fontSize: 16, lineHeight: 24 },
          strong: { fontWeight: '600', color: '#111827' },
          paragraph: { marginTop: 0, marginBottom: 8 },
        }}>
        {section.content}
      </Markdown>
    </View>
  );
}

function TabContent({ tab }: { tab: PropertyInfoTab }) {
  return (
    <View className="gap-4">
      {tab.sections.map((section, idx) => (
        <View key={idx} className="rounded-xl border border-gray-200 bg-white p-4">
          <SectionContent section={section} />
        </View>
      ))}
    </View>
  );
}

/** Fallback when tabs is empty (e.g. Clear Lake). Shows basic info and instructions. */
function EmptyTabsContent({ info }: { info: PropertyInfo }) {
  const sections: { title: string; content: string }[] = [];

  sections.push({
    title: 'Property',
    content: `**${info.name}**\n\nCheck-in: ${info.check_in_time} | Check-out: ${info.check_out_time}`,
  });

  if (info.check_in_instructions) {
    sections.push({ title: 'Check-in instructions', content: info.check_in_instructions });
  }
  if (info.check_out_instructions) {
    sections.push({ title: 'Check-out instructions', content: info.check_out_instructions });
  }
  if (info.notices) {
    sections.push({ title: 'Notices', content: info.notices });
  }
  if (info.wifi_network || info.wifi_password || info.door_code) {
    const parts: string[] = [];
    if (info.wifi_network) parts.push(`**Network:** ${info.wifi_network}`);
    if (info.wifi_password) parts.push(`**Password:** ${info.wifi_password}`);
    if (info.door_code) parts.push(`**Door code:** ${info.door_code}`);
    sections.push({ title: 'WiFi & access', content: parts.join('\n\n') });
  }

  if (sections.length === 0) {
    return <Text className="text-base text-gray-500">No property information available.</Text>;
  }

  return (
    <View className="gap-4">
      {sections.map((section, idx) => (
        <View key={idx} className="rounded-xl border border-gray-200 bg-white p-4">
          <SectionContent section={section} />
        </View>
      ))}
    </View>
  );
}

export function RulesInfoScreen() {
  const { data: info, error, isLoading } = usePropertyInfo('tahoe');
  const tabs = useMemo(() => info?.tabs ?? [], [info]);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

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
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-gray-600">
            {error instanceof Error ? error.message : 'Failed to load property information.'}
          </Text>
        </View>
      </KioskScreen>
    );
  }

  const hasTabs = tabs.length > 0;

  return (
    <KioskScreen title="Rules & info">
      <View className="flex-1 flex-row" style={{ gap: 12 }}>
        {/* Left nav - fixed width */}
        <View style={{ width: '20%', flexShrink: 0, flexGrow: 0 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 4 }}>
            {hasTabs ? (
              <Fragment>
                {tabs.map((tab) => (
                  <Pressable
                    key={tab.id}
                    onPress={() => setSelectedTabId(tab.id)}
                    className={`mb-1.5 rounded-lg px-3 py-3 ${
                      selectedTab?.id === tab.id ? 'bg-brand' : 'bg-gray-100'
                    }`}>
                    <Text
                      className={`text-sm font-medium ${
                        selectedTab?.id === tab.id ? 'text-white' : 'text-gray-700'
                      }`}
                      numberOfLines={2}>
                      {tab.title}
                    </Text>
                  </Pressable>
                ))}
              </Fragment>
            ) : (
              <View className="rounded-lg bg-brand px-3 py-3">
                <Text className="text-sm font-medium text-white">Info</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Right content - fills remaining space */}
        <ScrollView
          style={{ flex: 1, minWidth: 0 }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 24 }}>
          {hasTabs && selectedTab ? (
            <TabContent tab={selectedTab} />
          ) : (
            <EmptyTabsContent info={info} />
          )}
        </ScrollView>
      </View>
    </KioskScreen>
  );
}
