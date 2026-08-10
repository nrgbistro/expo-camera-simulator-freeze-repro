import { useState } from 'react'
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'

const PLACEHOLDER_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0V' +
  'FhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/wAALCAAB' +
  'AAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAB//EABQQAQAAAAAAAAAAAAAAAAAA' +
  'AAD/2gAIAQEAAD8AGX//2Q=='

const PLACEHOLDER_URI = `data:image/jpeg;base64,${PLACEHOLDER_BASE64}`

type ActionButtonProps = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

function ActionButton({
  label,
  onPress,
  variant = 'primary',
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'secondary' && styles.secondaryButton,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'secondary' && styles.secondaryButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions()
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])

  const savePlaceholder = () => {
    setPhotos((current) => [...current, PLACEHOLDER_URI])
    setIsCameraOpen(false)
  }

  if (!permission) {
    return <View style={styles.screen} />
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          Camera permission is required to mount CameraView.
        </Text>
        <ActionButton
          label="Grant Camera Permission"
          onPress={requestPermission}
        />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved photos: {photos.length}</Text>
        <Text style={styles.instructions}>
          Open the camera and save a placeholder repeatedly.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.photos}>
        {photos.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={styles.thumbnail}
            accessibilityLabel={`Saved placeholder ${index + 1}`}
          />
        ))}
      </ScrollView>

      <View style={styles.primaryAction}>
        <ActionButton
          label="Open Camera"
          onPress={() => setIsCameraOpen(true)}
        />
      </View>

      {isCameraOpen && (
        <Modal
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsCameraOpen(false)}
        >
          <View style={styles.cameraScreen}>
            <CameraView style={StyleSheet.absoluteFill} facing="back" />
            <View style={styles.primaryAction}>
              <ActionButton
                label="Save Placeholder"
                onPress={savePlaceholder}
              />
            </View>
            <View style={styles.secondaryAction}>
              <ActionButton
                label="Cancel"
                onPress={() => setIsCameraOpen(false)}
                variant="secondary"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    paddingTop: 72,
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  instructions: {
    color: '#52525b',
    fontSize: 16,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 24,
    paddingBottom: 220,
  },
  thumbnail: {
    width: 96,
    height: 72,
    backgroundColor: '#18181b',
    borderRadius: 8,
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  primaryAction: {
    position: 'absolute',
    right: 24,
    bottom: 112,
    left: 24,
    alignItems: 'center',
  },
  secondaryAction: {
    position: 'absolute',
    right: 24,
    bottom: 48,
    left: 24,
    alignItems: 'center',
  },
  actionButton: {
    width: 240,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#0a84ff',
  },
  actionButtonPressed: {
    opacity: 0.72,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  secondaryButtonText: {
    color: '#ffffff',
  },
})
