import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Platform, View, Pressable, TouchableOpacity } from 'react-native';
import { Mic } from 'lucide-react-native';
import {
  Canvas,
  Path,
  Paint,
  BlurMask,
  vec,
  Skia,
  Group,
  Circle,
  SweepGradient,
} from '@shopify/react-native-skia';

const ORB_CONTAINER_SIZE = 480; // Set a fixed large container size
const ORB_GLOW_WIDTH = 80; // Slightly reduced for balance
const ORB_SIZE = ORB_CONTAINER_SIZE - ORB_GLOW_WIDTH * 2; // Orb fills most of the container
const ORB_RING_WIDTH = 64;
const POINTS = 8;
const RING_RADIUS = 90;
const RING_WIDTH = 12;
const FRAGMENT_COLORS = ["#97A487", "#9A7D70", "#A8B0B8", "#97A487", "#9A7D70", "#A8B0B8"];
const FRAGMENT_COUNT = 6;
const FRAGMENT_SWEEP = 32; // degrees per fragment
const FRAGMENT_GAP = 28; // degrees between fragments
const FRAGMENT_WIDTH = 4; // very thin
const ANIMATION_SPEED = 0.0015; // radians/ms, faster and smoother
const GLOW_BLUR = 8;

const ORB_GRADIENT_COLORS = [
  '#97A487', // greenish
  '#9A7D70', // brownish
  '#A8B0B8', // blue-gray
  '#97A487', // repeat for smoothness
];
const ORB_GRADIENT_STOPS = [0, 0.33, 0.66, 1];
const ORB_BG = '#F7F0E7'; // your soft off-white

// Set mic icon size proportional to orb
const MIC_ICON_SIZE = ORB_SIZE * 0.18;

export function AnimatedMic({ listening, onPress }: { listening: boolean; onPress?: () => void }) {
  if (Platform.OS === 'web') {
    const [webT, setWebT] = React.useState(0);
    React.useEffect(() => {
      if (!listening) return;
      let frame: number;
      let start = Date.now();
      function animate() {
        setWebT(((Date.now() - start) * ANIMATION_SPEED) % (2 * Math.PI));
        frame = requestAnimationFrame(animate);
      }
      animate();
      return () => cancelAnimationFrame(frame);
    }, [listening]);
    return (
      <Pressable
        onPress={onPress}
        style={{
          width: ORB_CONTAINER_SIZE,
          height: ORB_CONTAINER_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: ORB_BG,
          borderRadius: ORB_CONTAINER_SIZE / 2,
          overflow: 'hidden',
        }}
      >
        <svg
          width={ORB_SIZE}
          height={ORB_SIZE}
          style={{ position: 'absolute', left: ORB_GLOW_WIDTH, top: ORB_GLOW_WIDTH, zIndex: 1 }}
        >
          <defs>
            <linearGradient id="orb-gradient" gradientTransform={`rotate(${(webT * 180 / Math.PI)})`}>
              <stop offset="0%" stopColor="#97A487" />
              <stop offset="33%" stopColor="#9A7D70" />
              <stop offset="66%" stopColor="#A8B0B8" />
              <stop offset="100%" stopColor="#97A487" />
            </linearGradient>
            <filter id="orb-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="16" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Glow ring */}
          <circle
            cx={ORB_SIZE/2}
            cy={ORB_SIZE/2}
            r={ORB_SIZE/2 - ORB_RING_WIDTH/2 - 8}
            stroke="url(#orb-gradient)"
            strokeWidth={ORB_GLOW_WIDTH}
            fill="none"
            opacity={0.45}
            filter="url(#orb-glow)"
            style={{ transformOrigin: '50% 50%', transform: `rotate(${(webT * 180 / Math.PI)}deg)` }}
          />
          {/* Main ring */}
          <circle
            cx={ORB_SIZE/2}
            cy={ORB_SIZE/2}
            r={ORB_SIZE/2 - ORB_RING_WIDTH/2 - 8}
            stroke="url(#orb-gradient)"
            strokeWidth={ORB_RING_WIDTH}
            fill="none"
            opacity={0.95}
            style={{ filter: 'blur(0.5px)', transformOrigin: '50% 50%', transform: `rotate(${(webT * 180 / Math.PI)}deg)` }}
          />
        </svg>
        {/* Center mic icon */}
        <View style={{
          position: 'absolute',
          left: ORB_GLOW_WIDTH, top: ORB_GLOW_WIDTH,
          width: ORB_SIZE, height: ORB_SIZE,
          alignItems: 'center', justifyContent: 'center',
          zIndex: 2,
        }}>
          <Mic size={MIC_ICON_SIZE} color="#fff" />
        </View>
      </Pressable>
    );
  }

  const [t, setT] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!listening) return;
    let start = Date.now();
    function animate() {
      setT(((Date.now() - start) * ANIMATION_SPEED) % (2 * Math.PI));
      animRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return undefined;
    };
  }, [listening]);

  const center = useMemo(() => vec(ORB_SIZE / 2, ORB_SIZE / 2), []);
  const ringRadius = ORB_SIZE/2 - ORB_RING_WIDTH/2 - 8;
  const ringSweep = 360;

  return (
    <View
      style={{
        width: ORB_CONTAINER_SIZE,
        height: ORB_CONTAINER_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ORB_BG,
        borderRadius: ORB_CONTAINER_SIZE / 2,
        overflow: 'hidden',
      }}
    >
      <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE, position: 'absolute', left: ORB_GLOW_WIDTH, top: ORB_GLOW_WIDTH }}>
        {/* Glow ring */}
        <Circle
          cx={ORB_SIZE/2}
          cy={ORB_SIZE/2}
          r={ringRadius}
          style="stroke"
          strokeWidth={ORB_GLOW_WIDTH}
          opacity={0.45}
        >
          <SweepGradient
            c={center}
            colors={ORB_GRADIENT_COLORS}
            positions={ORB_GRADIENT_STOPS}
            start={t}
            end={t + 2 * Math.PI}
          />
          <Paint>
            <BlurMask blur={16} style="normal" />
          </Paint>
        </Circle>
        {/* Main ring */}
        <Circle
          cx={ORB_SIZE/2}
          cy={ORB_SIZE/2}
          r={ringRadius}
          style="stroke"
          strokeWidth={ORB_RING_WIDTH}
          opacity={0.95}
        >
          <SweepGradient
            c={center}
            colors={ORB_GRADIENT_COLORS}
            positions={ORB_GRADIENT_STOPS}
            start={t}
            end={t + 2 * Math.PI}
          />
          <Paint>
            <BlurMask blur={1.5} style="normal" />
          </Paint>
        </Circle>
      </Canvas>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={{
          position: 'absolute',
          left: ORB_GLOW_WIDTH,
          top: ORB_GLOW_WIDTH,
          width: ORB_SIZE,
          height: ORB_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <Mic size={MIC_ICON_SIZE} color="#fff" />
      </TouchableOpacity>
    </View>
  );
} 