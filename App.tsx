import { useState } from 'react'
import {
  Button,
  Image,
  Modal,
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
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved photos: {photos.length}</Text>
        <Text style={styles.instructions}>
          Open the camera and save a placeholder three times quickly.
        </Text>
        <Button title="Open Camera" onPress={() => setIsCameraOpen(true)} />
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

      {isCameraOpen && (
        <Modal
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsCameraOpen(false)}
        >
          <View style={styles.cameraScreen}>
            <CameraView style={StyleSheet.absoluteFill} facing="back" />
            <View style={styles.cameraActions}>
              <Button
                title="Save Placeholder"
                onPress={savePlaceholder}
                color="#ffffff"
              />
              <Button
                title="Cancel"
                onPress={() => setIsCameraOpen(false)}
                color="#ffffff"
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
    padding: 24,
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
    padding: 24,
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
  cameraActions: {
    position: 'absolute',
    right: 0,
    bottom: 24,
    left: 0,
    gap: 12,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
})
