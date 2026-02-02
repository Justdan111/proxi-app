import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { 
  Search,
  MapPin, 
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  Share2,
  Archive,
  Filter,
  SortAsc,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

type Reminder = {
  id: string;
  title: string;
  location: string;
  address: string;
  radius: string;
  icon: string;
  enabled: boolean;
  frequency: string;
  createdAt: string;
  category: string;
};

export default function ExplorerScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'location'>('date');

  // Sample reminders data
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Buy fuel',
      location: 'Shell Station',
      address: 'Atlantic Ave, Brooklyn',
      radius: '300m',
      icon: '⛽',
      enabled: true,
      frequency: 'Daily',
      createdAt: '2024-02-01',
      category: 'errands',
    },
    {
      id: '2',
      title: 'Pick up dry cleaning',
      location: 'The Cleaners',
      address: '5th Ave, Brooklyn',
      radius: '100m',
      icon: '👔',
      enabled: true,
      frequency: 'Weekly',
      createdAt: '2024-02-02',
      category: 'errands',
    },
    {
      id: '3',
      title: 'Gym session',
      location: 'Equinox',
      address: 'Dumbo, Brooklyn',
      radius: '200m',
      icon: '🏋️',
      enabled: false,
      frequency: 'Daily',
      createdAt: '2024-01-28',
      category: 'fitness',
    },
    {
      id: '4',
      title: 'Coffee meeting',
      location: 'Coffee Collective',
      address: 'Jægersborggade 10, Copenhagen',
      radius: '150m',
      icon: '☕',
      enabled: true,
      frequency: 'Once',
      createdAt: '2024-02-03',
      category: 'work',
    },
  ]);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const searchOpacity = useSharedValue(0);
  const searchScale = useSharedValue(0.95);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    // Search animation
    setTimeout(() => {
      searchOpacity.value = withTiming(1, { duration: 500 });
      searchScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    }, 200);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ scale: searchScale.value }],
  }));

  const filteredReminders = reminders
    .filter((reminder) => {
      const matchesSearch = 
        reminder.title.toLowerCase().includes(search.toLowerCase()) ||
        reminder.location.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterCategory === 'all' || reminder.category === filterCategory;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'location') return a.location.localeCompare(b.location);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleAction = (action: string, reminder: Reminder) => {
    setShowActions(false);
    
    switch (action) {
      case 'view':
        setSelectedReminder(reminder);
        setShowDetails(true);
        break;
      case 'edit':
        // Navigate to edit screen
        console.log('Edit reminder:', reminder.id);
        break;
      case 'duplicate':
        const duplicate = { ...reminder, id: Math.random().toString(), title: `${reminder.title} (Copy)` };
        setReminders([...reminders, duplicate]);
        break;
      case 'share':
        console.log('Share reminder:', reminder.id);
        break;
      case 'archive':
        console.log('Archive reminder:', reminder.id);
        break;
      case 'delete':
        Alert.alert(
          'Delete Reminder',
          `Are you sure you want to delete "${reminder.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => setReminders(reminders.filter((r) => r.id !== reminder.id)),
            },
          ]
        );
        break;
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map((r) => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-32">
          {/* Header */}
          <Animated.View style={headerAnimatedStyle} className="mb-6">
            <Text className="text-foreground dark:text-foreground-dark text-4xl font-bold mb-2">
              Explorer
            </Text>
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
              Manage all your location reminders
            </Text>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View style={searchAnimatedStyle} className="mb-6">
            <View className="flex-row items-center bg-card dark:bg-card-dark rounded-2xl px-5 py-4">
              <Search size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
              <TextInput
                placeholder="Search reminders..."
                placeholderTextColor="#6B7280"
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-foreground dark:text-foreground-dark text-base"
              />
            </View>
          </Animated.View>

          {/* Filter & Sort */}
          <Animated.View entering={FadeIn.delay(400)} className="flex-row gap-3 mb-6">
            <TouchableOpacity className="flex-1 bg-card dark:bg-card-dark rounded-2xl px-4 py-3 flex-row items-center justify-center border border-border dark:border-border-dark">
              <Filter size={18} className="text-accent dark:text-accent-dark mr-2" />
              <Text className="text-foreground dark:text-foreground-dark font-semibold text-sm">
                Filter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-card dark:bg-card-dark rounded-2xl px-4 py-3 flex-row items-center justify-center border border-border dark:border-border-dark">
              <SortAsc size={18} className="text-accent dark:text-accent-dark mr-2" />
              <Text className="text-foreground dark:text-foreground-dark font-semibold text-sm">
                Sort
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(500)} className="bg-accent/10 dark:bg-accent-dark/10 rounded-2xl p-4 mb-6 border border-accent/20 dark:border-accent-dark/20">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-foreground dark:text-foreground-dark text-2xl font-bold">
                  {reminders.length}
                </Text>
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-1">
                  Total
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-accent dark:text-accent-dark text-2xl font-bold">
                  {reminders.filter(r => r.enabled).length}
                </Text>
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-1">
                  Active
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-2xl font-bold">
                  {reminders.filter(r => !r.enabled).length}
                </Text>
                <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs mt-1">
                  Disabled
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Reminders List */}
          {filteredReminders.length === 0 ? (
            <Animated.View entering={FadeIn.delay(600)} className="items-center justify-center py-12">
              <Text className="text-6xl mb-4">🔍</Text>
              <Text className="text-foreground dark:text-foreground-dark text-lg font-bold mb-2">
                No reminders found
              </Text>
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm text-center">
                Try adjusting your search or filters
              </Text>
            </Animated.View>
          ) : (
            <View className="gap-3">
              {filteredReminders.map((reminder, index) => (
                <Animated.View
                  key={reminder.id}
                  entering={FadeInDown.delay(600 + index * 100).springify()}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedReminder(reminder);
                      setShowDetails(true);
                    }}
                    className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark"
                  >
                    <View className="flex-row items-start">
                      {/* Icon */}
                      <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-2xl p-3 mr-4">
                        <Text className="text-3xl">{reminder.icon}</Text>
                      </View>

                      {/* Content */}
                      <View className="flex-1 mr-3">
                        <Text className="text-foreground dark:text-foreground-dark font-bold text-lg mb-2">
                          {reminder.title}
                        </Text>
                        <View className="flex-row items-center mb-1">
                          <MapPin size={14} className="text-muted-foreground dark:text-muted-foreground-dark mr-1" />
                          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-sm">
                            {reminder.location}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2 mt-2">
                          <View className="bg-muted dark:bg-muted-dark px-2 py-1 rounded">
                            <Text className="text-foreground dark:text-foreground-dark text-xs font-semibold">
                              {reminder.radius}
                            </Text>
                          </View>
                          <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs italic">
                            {reminder.frequency}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedReminder(reminder);
                          setShowActions(true);
                        }}
                        className="p-2"
                      >
                        <MoreVertical size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
                      </TouchableOpacity>
                    </View>

                    {/* Status indicator */}
                    {!reminder.enabled && (
                      <View className="absolute top-5 right-5 bg-muted dark:bg-muted-dark px-2 py-1 rounded">
                        <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold">
                          DISABLED
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowActions(false)}
          className="flex-1 bg-background/80 dark:bg-background-dark/80 justify-end"
        >
          <Animated.View entering={FadeInDown.springify()} className="bg-card dark:bg-card-dark rounded-t-3xl p-6 border-t border-border dark:border-border-dark">
            <View className="w-12 h-1 bg-muted dark:bg-muted-dark rounded-full self-center mb-6" />
            
            <Text className="text-foreground dark:text-foreground-dark text-xl font-bold mb-4">
              Actions
            </Text>

            <View className="gap-2">
              <TouchableOpacity
                onPress={() => selectedReminder && handleAction('view', selectedReminder)}
                className="flex-row items-center bg-background dark:bg-background-dark rounded-2xl p-4"
              >
                <Eye size={20} className="text-accent dark:text-accent-dark mr-3" />
                <Text className="text-foreground dark:text-foreground-dark font-semibold">
                  View Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedReminder && handleAction('edit', selectedReminder)}
                className="flex-row items-center bg-background dark:bg-background-dark rounded-2xl p-4"
              >
                <Edit size={20} className="text-accent dark:text-accent-dark mr-3" />
                <Text className="text-foreground dark:text-foreground-dark font-semibold">
                  Edit Reminder
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedReminder && handleAction('duplicate', selectedReminder)}
                className="flex-row items-center bg-background dark:bg-background-dark rounded-2xl p-4"
              >
                <Copy size={20} className="text-accent dark:text-accent-dark mr-3" />
                <Text className="text-foreground dark:text-foreground-dark font-semibold">
                  Duplicate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedReminder && handleAction('share', selectedReminder)}
                className="flex-row items-center bg-background dark:bg-background-dark rounded-2xl p-4"
              >
                <Share2 size={20} className="text-accent dark:text-accent-dark mr-3" />
                <Text className="text-foreground dark:text-foreground-dark font-semibold">
                  Share
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedReminder && handleAction('archive', selectedReminder)}
                className="flex-row items-center bg-background dark:bg-background-dark rounded-2xl p-4"
              >
                <Archive size={20} className="text-muted-foreground dark:text-muted-foreground-dark mr-3" />
                <Text className="text-foreground dark:text-foreground-dark font-semibold">
                  Archive
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedReminder && handleAction('delete', selectedReminder)}
                className="flex-row items-center bg-destructive/10 dark:bg-destructive-dark/10 rounded-2xl p-4 border border-destructive/20 dark:border-destructive-dark/20"
              >
                <Trash2 size={20} className="text-destructive dark:text-destructive-dark mr-3" />
                <Text className="text-destructive dark:text-destructive-dark font-semibold">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDetails(false)}
          className="flex-1 bg-background/90 dark:bg-background-dark/90 justify-center px-6"
        >
          <Animated.View entering={FadeIn.springify()} className="bg-card dark:bg-card-dark rounded-3xl p-6 border border-border dark:border-border-dark">
            {selectedReminder && (
              <>
                <View className="items-center mb-6">
                  <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-3xl p-6 mb-4">
                    <Text className="text-6xl">{selectedReminder.icon}</Text>
                  </View>
                  <Text className="text-foreground dark:text-foreground-dark text-2xl font-bold mb-2">
                    {selectedReminder.title}
                  </Text>
                  <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
                    {selectedReminder.location}
                  </Text>
                </View>

                <View className="gap-3 mb-6">
                  <View className="bg-background dark:bg-background-dark rounded-2xl p-4">
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-2">
                      Address
                    </Text>
                    <Text className="text-foreground dark:text-foreground-dark">
                      {selectedReminder.address}
                    </Text>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-background dark:bg-background-dark rounded-2xl p-4">
                      <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-2">
                        Radius
                      </Text>
                      <Text className="text-foreground dark:text-foreground-dark font-bold">
                        {selectedReminder.radius}
                      </Text>
                    </View>

                    <View className="flex-1 bg-background dark:bg-background-dark rounded-2xl p-4">
                      <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-2">
                        Frequency
                      </Text>
                      <Text className="text-foreground dark:text-foreground-dark font-bold">
                        {selectedReminder.frequency}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-background dark:bg-background-dark rounded-2xl p-4">
                    <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold uppercase mb-2">
                      Status
                    </Text>
                    <Text className={`font-bold ${selectedReminder.enabled ? 'text-accent dark:text-accent-dark' : 'text-muted-foreground dark:text-muted-foreground-dark'}`}>
                      {selectedReminder.enabled ? 'Active' : 'Disabled'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setShowDetails(false)}
                  className="bg-accent dark:bg-accent-dark rounded-full py-4 items-center"
                >
                  <Text className="text-accent-foreground dark:text-accent-foreground-dark font-bold">
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}