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
import * as Location from 'expo-location';
import { useReminders } from '@/context/reminderContext';
import type { Reminder } from '@/lib/api';
import { Coordinates, getDistanceMetres, formatDistance } from '@/lib/location/distance';

function useDistanceToReminder(reminder: Reminder, currentCoordinates: Coordinates | null) {
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (currentCoordinates) {
      const metres = getDistanceMetres(currentCoordinates, reminder.coordinates);
      setDistance(formatDistance(metres));
      return;
    }

    let mounted = true;

    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((loc) => {
        if (!mounted) return;

        const metres = getDistanceMetres(
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          reminder.coordinates
        );

        setDistance(formatDistance(metres));
      })
      .catch(() => {
        if (!mounted) return;
        setDistance(null);
      });

    return () => {
      mounted = false;
    };
  }, [currentCoordinates, reminder.id, reminder.coordinates]);

  return distance;
}

type ExplorerReminderCardProps = {
  reminder: Reminder;
  index: number;
  currentCoordinates: Coordinates | null;
  onOpenDetails: (reminder: Reminder) => void;
  onOpenActions: (reminder: Reminder) => void;
};

function ExplorerReminderCard({
  reminder,
  index,
  currentCoordinates,
  onOpenDetails,
  onOpenActions,
}: ExplorerReminderCardProps) {
  const distance = useDistanceToReminder(reminder, currentCoordinates);

  return (
    <Animated.View entering={FadeInDown.delay(600 + index * 100).springify()}>
      <TouchableOpacity
        onPress={() => onOpenDetails(reminder)}
        className="bg-card dark:bg-card-dark rounded-3xl p-5 border border-border dark:border-border-dark"
      >
        <View className="flex-row items-start">
          <View className="bg-accent/20 dark:bg-accent-dark/20 rounded-2xl p-3 mr-4">
            <Text className="text-3xl">{reminder.icon}</Text>
          </View>

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
                  {distance ?? '--'}
                </Text>
              </View>
              <View className="bg-muted dark:bg-muted-dark px-2 py-1 rounded">
                <Text className="text-foreground dark:text-foreground-dark text-xs font-semibold">
                  {reminder.radius}m
                </Text>
              </View>
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs italic">
                {reminder.frequency === 'once' ? 'Once' : 'Always'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onOpenActions(reminder)}
            className="p-2"
          >
            <MoreVertical size={20} className="text-muted-foreground dark:text-muted-foreground-dark" />
          </TouchableOpacity>
        </View>

        {!reminder.enabled && (
          <View className="absolute top-5 right-5 bg-muted dark:bg-muted-dark px-2 py-1 rounded">
            <Text className="text-muted-foreground dark:text-muted-foreground-dark text-xs font-bold">
              DISABLED
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ExplorerScreen() {
  const [search, setSearch] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterCategory] = useState<string>('all');
  const [sortBy] = useState<'date' | 'name' | 'location'>('date');
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const { reminders, deleteReminder } = useReminders();

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
  }, [headerOpacity, headerTranslateY, searchOpacity, searchScale]);

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startWatchingLocation = async () => {
      try {
        const existingPermission = await Location.getForegroundPermissionsAsync();
        const permission =
          existingPermission.status === 'granted'
            ? existingPermission
            : await Location.requestForegroundPermissionsAsync();

        if (!mounted || permission.status !== 'granted') {
          setIsLiveTracking(false);
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 25,
            timeInterval: 15000,
          },
          (position) => {
            if (!mounted) return;
            setCurrentCoordinates({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        );

        if (mounted) {
          setIsLiveTracking(true);
        }
      } catch {
        if (!mounted) return;
        setCurrentCoordinates(null);
        setIsLiveTracking(false);
      }
    };

    startWatchingLocation();

    return () => {
      mounted = false;
      subscription?.remove();
      setIsLiveTracking(false);
    };
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
      const matchesFilter = filterCategory === 'all' || reminder.frequency === filterCategory;
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
        Alert.alert('Coming soon', 'Edit reminder flow is not available yet.');
        break;
      case 'duplicate':
        Alert.alert('Coming soon', 'Duplicate action is not available yet.');
        break;
      case 'share':
        Alert.alert('Coming soon', 'Share action is not available yet.');
        break;
      case 'archive':
        Alert.alert('Coming soon', 'Archive action is not available yet.');
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
              onPress: () => {
                void deleteReminder(reminder.id);
              },
            },
          ]
        );
        break;
    }
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
            <View className="flex-row items-center">
              <Text className="text-muted-foreground dark:text-muted-foreground-dark text-base">
                Manage all your location reminders
              </Text>
              {isLiveTracking ? (
                <View className="ml-2 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                  <Text className="text-green-500 text-[10px] font-bold tracking-widest uppercase">Live</Text>
                </View>
              ) : null}
            </View>
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
                <ExplorerReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  index={index}
                  currentCoordinates={currentCoordinates}
                  onOpenDetails={(target) => {
                    setSelectedReminder(target);
                    setShowDetails(true);
                  }}
                  onOpenActions={(target) => {
                    setSelectedReminder(target);
                    setShowActions(true);
                  }}
                />
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
                        {selectedReminder.radius}m
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