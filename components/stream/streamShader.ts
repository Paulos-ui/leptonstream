/**
 * The stream shader.
 *
 * Concept: value looks continuous but is made of discrete quanta.
 *   - uZoom 0  → thousands of tiny particles read as one smooth ribbon
 *   - uZoom 1  → the field scales up, most particles are culled, the few that
 *                remain grow large and gap apart → you SEE the individual leptons
 *
 * Color runs amber (head, in-flight) → coral (tail, settling) along the flow.
 * uVelocity (scroll speed) pumps brightness so the hero feels "fed" by scroll.
 */

export const streamVertex = /* glsl */ `
  uniform float uTime;
  uniform float uZoom;      // 0..1  continuous → discrete
  uniform float uVelocity;  // 0..1  scroll velocity
  uniform float uThrottle;  // 0..1  agent throttle (slows + dims the flow)
  uniform float uFocus;     // 0..1  instrument channels the flow into a beam
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uWidth;     // flow field width in world units

  attribute float aSeed;
  attribute float aLaneWobble;

  varying float vAlpha;
  varying float vMix;       // 0 amber .. 1 coral

  void main() {
    vec3 p = position;

    // Continuous left→right flow, wrapped within the field width.
    // The agent's throttle slows the whole current.
    float speed = (0.35 + aSeed * 0.55) * (1.0 - 0.6 * uThrottle);
    float x = mod(p.x + uTime * speed + 100.0, uWidth) - uWidth * 0.5;

    // Gentle organic vertical drift so the band breathes.
    float y = p.y + sin(uTime * (0.3 + aSeed) + aSeed * 6.2831) * 0.06 * aLaneWobble;
    float z = p.z;

    // Zoom scales the whole field outward (camera dives in).
    // Focus narrows the band vertically — the instrument channels the flow.
    float scale = 1.0 + uZoom * 0.85;
    vec3 zoomed = vec3(x * scale, y * scale * (1.0 - 0.5 * uFocus), z);

    // Color progression along the flow.
    vMix = clamp((x + uWidth * 0.5) / uWidth, 0.0, 1.0);

    // Thin the herd as we zoom so the stream resolves into countable dots.
    float keep = mix(1.0, 0.30, uZoom);
    float visible = step(aSeed, keep);

    vec4 mv = modelViewMatrix * vec4(zoomed, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (1.0 + uZoom * 3.4) * uPixelRatio;
    gl_PointSize = visible * size * (1.0 / max(-mv.z, 0.001));

    vAlpha = visible * (0.5 + uVelocity * 0.5) * (1.0 - 0.4 * uThrottle);
  }
`;

export const streamFragment = /* glsl */ `
  precision highp float;

  uniform vec3 uAmber;
  uniform vec3 uCoral;
  uniform vec3 uPeri;       // periwinkle — the agent's color
  uniform float uAgent;     // 0..1  agent presence (cools the stream)
  uniform float uPulse;     // 0..1  decision flash, decays over time
  uniform float uRate;      // 0..1  finale rate (0.5 = neutral intensity)

  varying float vAlpha;
  varying float vMix;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    // Soft round sprite with a hot core.
    float edge = smoothstep(0.5, 0.08, d);
    vec3 col = mix(uAmber, uCoral, vMix);
    col += (1.0 - smoothstep(0.0, 0.22, d)) * 0.22;

    // Agent presence cools the warm value toward periwinkle.
    col = mix(col, uPeri, uAgent * 0.5);
    // A committed decision flashes periwinkle across the whole stream.
    col += uPeri * uPulse * 0.5;

    // The finale slider scales overall intensity (0.5 → neutral).
    float gain = 0.7 + uRate * 0.6;
    gl_FragColor = vec4(
      col * (0.85 + uRate * 0.3),
      edge * vAlpha * (1.0 + uPulse * 0.3) * gain
    );
  }
`;
