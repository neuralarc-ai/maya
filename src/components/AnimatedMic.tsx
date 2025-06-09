import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Canvas, Path, Paint, BlurMask, useClockValue, useComputedValue, vec, Skia, Shader } from '@shopify/react-native-skia';
import { Mic } from 'lucide-react-native';

const ORB_SIZE = 200;
const POINTS = 8;

function getOrbPath(t: number) {
  const center = vec(ORB_SIZE / 2, ORB_SIZE / 2);
  const radius = 80;
  const points = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (2 * Math.PI * i) / POINTS;
    const wave = Math.sin(angle * 3 + t) * 18 + Math.cos(angle * 2.5 + t * 1.5) * 8;
    const r = radius + wave;
    const x = center.x + r * Math.cos(angle);
    const y = center.y + r * Math.sin(angle);
    points.push({ x, y });
  }
  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    path.lineTo(points[i].x, points[i].y);
  }
  path.close();
  return path;
}

export function AnimatedMic({ listening }: { listening: boolean }) {
  if (Platform.OS === 'web') {
    // Fallback: simple SVG orb for web
    return (
      <View style={{ width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <svg width={ORB_SIZE} height={ORB_SIZE} style={{ position: 'absolute', left: 0, top: 0 }}>
          <defs>
            <radialGradient id="orb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#007AFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <circle cx={ORB_SIZE/2} cy={ORB_SIZE/2} r={80} fill="url(#orb)" />
        </svg>
        <View style={{
          position: 'absolute',
          left: 0, top: 0, width: ORB_SIZE, height: ORB_SIZE,
          alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}>
          <Mic size={48} color="#fff" />
        </View>
      </View>
    );
  }

  // Native: Skia animated orb
  const clock = useClockValue();
  const t = useComputedValue(() => clock.current / (listening ? 800 : 2500), [clock, listening]);
  const path = useComputedValue(() => getOrbPath(t.current), [t]);

  const center = useMemo(() => vec(ORB_SIZE / 2, ORB_SIZE / 2), []);
  const gradient = useMemo(
    () =>
      Skia.Shader.MakeRadialGradient(
        center,
        80,
        ['#a855f7', '#007AFF', '#0ea5e9', '#00000000'],
        [0, 0.5, 0.8, 1],
        Skia.TileMode.Clamp
      ),
    [center]
  );

  return (
    <View style={{ width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
        {/* Outer Glow */}
        <Path path={path} style="stroke" strokeWidth={18} color="#60a5fa">
          <Paint>
            <BlurMask blur={48} style="normal" />
          </Paint>
        </Path>
        {/* Gradient Orb */}
        <Path path={path} style="fill">
          <Paint>
            <Shader shader={gradient} />
            <BlurMask blur={32} style="normal" />
          </Paint>
        </Path>
      </Canvas>
      <View style={{
        position: 'absolute',
        left: 0, top: 0, width: ORB_SIZE, height: ORB_SIZE,
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
      }}>
        <Mic size={48} color="#fff" />
      </View>
    </View>
  );
} 