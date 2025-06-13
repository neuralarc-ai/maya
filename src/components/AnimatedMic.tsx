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
} from '@shopify/react-native-skia';

const ORB_SIZE = 200;
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

export function AnimatedMic({ listening, onPress }: { listening: boolean; onPress?: () => void }) {
  if (Platform.OS === 'web') {
    // Fallback: animated SVG orb and ring for web
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
      <Pressable onPress={onPress} style={{ width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Animated rotating arc fragments with 3D effect */}
        {listening && (
          <svg
            width={ORB_SIZE}
            height={ORB_SIZE}
            style={{ position: 'absolute', left: 0, top: 0, zIndex: 2 }}
          >
            {Array.from({ length: FRAGMENT_COUNT }).map((_, i) => {
              // Animate rotation
              const baseAngle = (i * (FRAGMENT_SWEEP + FRAGMENT_GAP)) - 90;
              const angle = baseAngle + (webT * 180 / Math.PI);
              const color = FRAGMENT_COLORS[i % FRAGMENT_COLORS.length];
              const r = RING_RADIUS;
              const startAngle = (angle * Math.PI) / 180;
              const endAngle = ((angle + FRAGMENT_SWEEP) * Math.PI) / 180;
              // 3D effect: scale, opacity, and vertical offset
              const midAngle = (startAngle + endAngle) / 2;
              const depth = 0.5 + 0.5 * Math.sin(midAngle);
              const scale = 0.85 + 0.35 * depth;
              const opacity = 0.25 + 0.75 * Math.pow(depth, 1.5);
              const yOffset = 16 * Math.cos(midAngle); // vertical "rise"
              // Arc endpoints
              const x1 = ORB_SIZE / 2 + r * Math.cos(startAngle) * scale;
              const y1 = ORB_SIZE / 2 + r * Math.sin(startAngle) * scale + yOffset;
              const x2 = ORB_SIZE / 2 + r * Math.cos(endAngle) * scale;
              const y2 = ORB_SIZE / 2 + r * Math.sin(endAngle) * scale + yOffset;
              const largeArcFlag = FRAGMENT_SWEEP > 180 ? 1 : 0;
              return (
                <g key={i}>
                  {/* Glow */}
                  <path
                    d={`M ${x1} ${y1} A ${r*scale} ${r*scale} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                    stroke={color}
                    strokeWidth={FRAGMENT_WIDTH * 2.5}
                    strokeLinecap="round"
                    fill="none"
                    style={{ filter: `blur(${GLOW_BLUR}px)`, opacity: opacity * 0.5 }}
                  />
                  {/* Main arc */}
                  <path
                    d={`M ${x1} ${y1} A ${r*scale} ${r*scale} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                    stroke={color}
                    strokeWidth={FRAGMENT_WIDTH}
                    strokeLinecap="round"
                    fill="none"
                    style={{ opacity }}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {/* Orb */}
        <svg
          width={ORB_SIZE}
          height={ORB_SIZE}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <defs>
            <radialGradient id="orb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#B7BEAE" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#2B2521" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#B7A694" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <circle cx={ORB_SIZE/2} cy={ORB_SIZE/2} r={80} fill="url(#orb)" />
          <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </svg>
        <View style={{
          position: 'absolute',
          left: 0, top: 0, width: ORB_SIZE, height: ORB_SIZE,
          alignItems: 'center', justifyContent: 'center',
          zIndex: 3,
        }}>
          <Mic size={48} color="#fff" />
        </View>
      </Pressable>
    );
  }

  // Native: Skia animated orb and rotating arc fragments with 3D effect
  const [t, setT] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
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
  const rotation = useMemo(() => t, [t, listening]);

  function getArcFragmentPath(startDeg: number, sweepDeg: number, scale: number, yOffset: number) {
    const r = RING_RADIUS * scale;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = ((startDeg + sweepDeg) * Math.PI) / 180;
    const x1 = ORB_SIZE / 2 + r * Math.cos(startRad);
    const y1 = ORB_SIZE / 2 + r * Math.sin(startRad) + yOffset;
    const x2 = ORB_SIZE / 2 + r * Math.cos(endRad);
    const y2 = ORB_SIZE / 2 + r * Math.sin(endRad) + yOffset;
    const largeArcFlag = sweepDeg > 180;
    const sweepFlag = true;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const path = Skia.Path.Make();
    path.moveTo(x1, y1);
    path.rArcTo(r, r, 0, largeArcFlag, sweepFlag, dx, dy);
    return path;
  }

  function getOrbPath(t: number) {
    const radius = 80;
    const points = [];
    for (let i = 0; i < POINTS; i++) {
      const angle = (2 * Math.PI * i) / POINTS;
      const wave = Math.sin(angle * 3 + t) * 18 + Math.cos(angle * 2.5 + t * 1.5) * 8;
      const r = radius + wave;
      const x = ORB_SIZE / 2 + r * Math.cos(angle);
      const y = ORB_SIZE / 2 + r * Math.sin(angle);
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

  const path = useMemo(() => getOrbPath(t), [t]);

  return (
    <View style={{ width: ORB_SIZE, height: ORB_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
        {/* Rotating arc fragments with 3D effect when listening */}
        {listening && (
          <Group origin={center} transform={[{ rotate: rotation }] }>
            {Array.from({ length: FRAGMENT_COUNT }).map((_, i) => {
              const baseAngle = (i * (FRAGMENT_SWEEP + FRAGMENT_GAP)) - 90;
              const angle = baseAngle + (t * 180 / Math.PI);
              const color = FRAGMENT_COLORS[i % FRAGMENT_COLORS.length];
              const startRad = (angle * Math.PI) / 180;
              const endRad = ((angle + FRAGMENT_SWEEP) * Math.PI) / 180;
              const midAngle = (startRad + endRad) / 2;
              const depth = 0.5 + 0.5 * Math.sin(midAngle);
              const scale = 0.85 + 0.35 * depth;
              const opacity = 0.25 + 0.75 * Math.pow(depth, 1.5);
              const yOffset = 16 * Math.cos(midAngle);
              return (
                <>
                  {/* Glow */}
                  <Path
                    key={`glow-${i}`}
                    path={getArcFragmentPath(angle, FRAGMENT_SWEEP, scale, yOffset)}
                    style="stroke"
                    strokeWidth={FRAGMENT_WIDTH * 2.5}
                    color={Skia.Color(color)}
                    strokeCap="round"
                    opacity={opacity * 0.5}
                  >
                    <Paint>
                      <BlurMask blur={GLOW_BLUR} style="normal" />
                    </Paint>
                  </Path>
                  {/* Main arc */}
                  <Path
                    key={`main-${i}`}
                    path={getArcFragmentPath(angle, FRAGMENT_SWEEP, scale, yOffset)}
                    style="stroke"
                    strokeWidth={FRAGMENT_WIDTH}
                    color={Skia.Color(color)}
                    strokeCap="round"
                    opacity={opacity}
                  >
                    <Paint>
                      <BlurMask blur={2} style="normal" />
                    </Paint>
                  </Path>
                </>
              );
            })}
          </Group>
        )}
        {/* Orb */}
        <Group>
          {/* Outer Glow */}
          <Path path={path} style="stroke" strokeWidth={18} color={Skia.Color('#B7BEAE')}>
            <Paint>
              <BlurMask blur={48} style="normal" />
            </Paint>
          </Path>
          {/* Inner Orb */}
          <Path path={path} style="fill" color={Skia.Color('#2B2521')}>
            <Paint>
              <BlurMask blur={32} style="normal" />
            </Paint>
          </Path>
        </Group>
      </Canvas>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: ORB_SIZE,
          height: ORB_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
        }}
      >
        <Mic size={48} color="#fff" />
      </TouchableOpacity>
    </View>
  );
} 