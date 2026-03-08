import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { colors, fonts } from '../../styles';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Two detections are the "same region" if their normalized centers are within this distance
const POSITION_THRESHOLD = 0.1;
// Each scan cycle, items NOT seen are multiplied by this (they fade away)
const DECAY_FACTOR = 0.8;
const MAX_HITS = 15;
// Minimum accumulated score before an item appears in the UI
const MIN_HITS_TO_SHOW = 1.5;

/**
 * Merges a new set of detected lines into the running accumulator.
 * Each item tracks a normalized (0-1) center position and a confidence score (hits).
 * Items seen repeatedly at the same position gain score; missing items decay.
 */
function mergeDetections(prev, lines, imgW, imgH) {
  const next = prev.map(item => ({ ...item, hits: item.hits * DECAY_FACTOR }));

  for (const line of lines) {
    const { text, frame } = line;
    if (!text?.trim() || !frame) continue;

    const cx = (frame.left + frame.width / 2) / imgW;
    const cy = (frame.top + frame.height / 2) / imgH;

    let best = null;
    let bestDist = POSITION_THRESHOLD;
    for (const item of next) {
      const d = Math.hypot(item.cx - cx, item.cy - cy);
      if (d < bestDist) { bestDist = d; best = item; }
    }

    if (best) {
      best.text = text.trim();
      // Smooth position toward the new detection (weighted average)
      best.cx = best.cx * 0.7 + cx * 0.3;
      best.cy = best.cy * 0.7 + cy * 0.3;
      best.hits = Math.min(best.hits + 1, MAX_HITS);
    } else {
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: text.trim(),
        cx,
        cy,
        hits: 1,
      });
    }
  }

  return next.filter(item => item.hits > 0.3);
}

/**
 * Maps a normalized image coordinate to a screen pixel position,
 * accounting for the cover-mode scaling applied to the camera preview.
 */
function toScreenPos(cx, cy, imgW, imgH) {
  const scale = Math.max(SCREEN_W / imgW, SCREEN_H / imgH);
  const ox = (SCREEN_W - imgW * scale) / 2;
  const oy = (SCREEN_H - imgH * scale) / 2;
  return { x: cx * imgW * scale + ox, y: cy * imgH * scale + oy };
}

export default function ScanView({ navigation }) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef(null);
  const isProcessing = useRef(false);
  const accumulatedRef = useRef([]);
  const [displayItems, setDisplayItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [imgDims, setImgDims] = useState(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    if (!hasPermission || !device) return;

    const interval = setInterval(async () => {
      if (isProcessing.current || !cameraRef.current) return;
      isProcessing.current = true;
      setScanning(true);
      try {
        const photo = await cameraRef.current.takePhoto({ qualityPrioritization: 'speed' });
        const rawPath = photo.path;
        const imagePath = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;

        // ML Kit bounding boxes are in "corrected" orientation space,
        // so swap w/h when the sensor captures in landscape on a portrait device
        const rotated =
          photo.orientation === 'landscape-left' || photo.orientation === 'landscape-right';
        const imgW = rotated ? photo.height : photo.width;
        const imgH = rotated ? photo.width : photo.height;
        setImgDims({ w: imgW, h: imgH });

        const result = await TextRecognition.recognize(imagePath);
        setError(null);

        // Use line-level detections — finer-grained than blocks
        const lines = result.blocks?.flatMap(b => b.lines ?? []) ?? [];
        accumulatedRef.current = mergeDetections(accumulatedRef.current, lines, imgW, imgH);
        setDisplayItems([...accumulatedRef.current]);
      } catch (e) {
        setError(String(e?.message ?? e));
      } finally {
        isProcessing.current = false;
        setScanning(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [hasPermission, device]);

  const handleClear = useCallback(() => {
    accumulatedRef.current = [];
    setDisplayItems([]);
    setError(null);
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>
          Camera permission is required to scan prescriptions.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  const visibleItems = displayItems.filter(i => i.hits >= MIN_HITS_TO_SHOW);

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        resizeMode="cover"
      />

      {/* Positional text labels pinned over the camera feed */}
      {imgDims && visibleItems.map(item => {
        const { x, y } = toScreenPos(item.cx, item.cy, imgDims.w, imgDims.h);
        const confidence = Math.min(item.hits / MAX_HITS, 1);
        return (
          <View
            key={item.id}
            pointerEvents="none"
            style={[styles.textTag, { left: x - 60, top: y - 12, opacity: 0.35 + confidence * 0.65 }]}
          >
            <Text style={styles.textTagText} numberOfLines={1}>{item.text}</Text>
          </View>
        );
      })}

      {/* Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}>
        <Icon name="arrow-left" size={20} color="white" />
      </TouchableOpacity>

      {/* Scanning badge */}
      {scanning && (
        <View style={styles.scanningBadge}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.scanningText}>Scanning…</Text>
        </View>
      )}

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} numberOfLines={3}>{error}</Text>
        </View>
      )}

      {/* Bottom accumulated results panel */}
      <View style={styles.overlay}>
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayLabel}>
            {visibleItems.length === 0
              ? 'Point at text to begin…'
              : `${visibleItems.length} region${visibleItems.length !== 1 ? 's' : ''} detected`}
          </Text>
          {visibleItems.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
          {visibleItems
            // Sort top-to-bottom, left-to-right — matches reading order on a label
            .slice()
            .sort((a, b) => a.cy !== b.cy ? a.cy - b.cy : a.cx - b.cx)
            .map(item => {
              const confidence = Math.min(item.hits / MAX_HITS, 1);
              return (
                <View key={item.id} style={styles.resultRow}>
                  <View style={styles.resultBarBg}>
                    <View style={[styles.resultBar, { width: `${Math.round(confidence * 100)}%` }]} />
                  </View>
                  <Text style={[styles.resultText, { opacity: 0.5 + confidence * 0.5 }]}>
                    {item.text}
                  </Text>
                </View>
              );
            })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningBadge: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  scanningText: {
    color: 'white',
    fontSize: 12,
    fontFamily: fonts.primaryRegular,
  },
  errorBanner: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(180,0,0,0.75)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: 'white',
    fontSize: 12,
    fontFamily: fonts.primaryRegular,
  },
  // Pinned label rendered over the camera feed at detected position
  textTag: {
    position: 'absolute',
    backgroundColor: 'rgba(85,92,196,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 160,
  },
  textTagText: {
    color: 'white',
    fontSize: 10,
    fontFamily: fonts.primaryBold,
  },
  // Bottom panel
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.38,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overlayLabel: {
    fontSize: 11,
    fontFamily: fonts.primaryBold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resetText: {
    fontSize: 12,
    fontFamily: fonts.primaryRegular,
    color: 'rgba(255,255,255,0.5)',
  },
  scrollList: { flex: 1 },
  resultRow: { marginBottom: 10 },
  resultBarBg: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 1,
    marginBottom: 4,
  },
  resultBar: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  resultText: {
    fontSize: 14,
    fontFamily: fonts.primaryRegular,
    color: 'white',
    lineHeight: 18,
  },
  permText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fonts.primaryRegular,
  },
  permButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permButtonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: fonts.primaryBold,
  },
});
