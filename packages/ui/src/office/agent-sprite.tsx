import type { AgentName } from "@honeymoney/agents";
import type { JSX } from "react";
import { AGENT_META, type AgentMeta } from "./agents-meta";
import type { VisualState } from "./states";

/**
 * Original 2D character at a desk, drawn in SVG. All motion is CSS (see OFFICE_CSS), driven by
 * `data-state`, so it costs nothing on phones and respects prefers-reduced-motion.
 */
export function AgentSprite({ agent, state, size = 160 }: { agent: AgentName; state: VisualState; size?: number }) {
  const meta = AGENT_META[agent];
  const { shirt, skin } = meta.look;
  return (
    <svg
      viewBox="0 0 160 140"
      width={size}
      height={(size * 140) / 160}
      className="hm-sprite"
      data-state={state}
      role="img"
      aria-label={`${meta.name}: ${state}`}
    >
      {/* floor shadow */}
      <ellipse cx="80" cy="130" rx="62" ry="7" fill="currentColor" opacity="0.08" />
      {/* chair */}
      <rect x="50" y="50" width="60" height="56" rx="12" fill="#57534e" />
      <rect x="54" y="54" width="52" height="48" rx="10" fill="#78716c" />

      {/* character */}
      <g className="hm-body">
        <rect x="58" y="70" width="44" height="38" rx="15" fill={shirt} />
        <rect x="74" y="61" width="12" height="11" rx="3" fill={skin} />
        <circle cx="80" cy="49" r="17" fill={skin} />
        <Hair meta={meta} />
        <g className="hm-eyes">
          <circle cx="74" cy="51" r="1.9" fill="#1c1917" />
          <circle cx="86" cy="51" r="1.9" fill="#1c1917" />
        </g>
        <path
          d={state === "error" || state === "needs_changes" ? "M76 59 Q80 56 84 59" : "M75.5 57.5 Q80 61.5 84.5 57.5"}
          stroke="#1c1917"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="70" cy="56" r="2.4" fill="#f43f5e" opacity="0.18" />
        <circle cx="90" cy="56" r="2.4" fill="#f43f5e" opacity="0.18" />
        {/* arms */}
        <g className="hm-arm-l">
          <rect x="54" y="76" width="10" height="24" rx="5" fill={shirt} transform="rotate(-18 59 78)" />
          <circle cx="64" cy="98" r="4.5" fill={skin} />
        </g>
        <g className="hm-arm-r">
          <rect x="96" y="76" width="10" height="24" rx="5" fill={shirt} transform="rotate(18 101 78)" />
          <circle cx="96" cy="98" r="4.5" fill={skin} />
        </g>
      </g>

      {/* screen glow on the character */}
      <rect className="hm-glow" x="62" y="72" width="36" height="20" rx="8" fill="#fde68a" />

      {/* desk */}
      <rect x="18" y="98" width="124" height="10" rx="3" fill="#b45309" />
      <rect x="24" y="108" width="112" height="18" rx="2" fill="#92400e" />
      <rect x="24" y="108" width="112" height="3" fill="#78350f" opacity="0.6" />

      {/* laptop (back side faces us) */}
      <rect x="61" y="80" width="38" height="20" rx="3" fill="#e7e5e4" />
      <path d="M80 85 q4 4 0 9 q-4 -5 0 -9z" fill="#f59e0b" />
      <rect x="57" y="98" width="46" height="3" rx="1.5" fill="#d6d3d1" />

      {/* mug + steam */}
      <rect x="28" y="88" width="12" height="11" rx="2" fill="#fafaf9" />
      <path d="M40 91 q5 0 5 4 q0 3 -5 3" stroke="#fafaf9" strokeWidth="2" fill="none" />
      <g className="hm-steam" stroke="#a8a29e" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M31 84 q-2 -3 0 -6 q2 -3 0 -6" />
        <path d="M36 84 q-2 -3 0 -6 q2 -3 0 -6" />
      </g>

      <Accessory kind={meta.accessory} />

      {/* paper flying to the next desk */}
      <g className="hm-paper">
        <rect x="84" y="70" width="14" height="18" rx="1.5" fill="#ffffff" stroke="#d6d3d1" />
        <path d="M87 75h8M87 79h8M87 83h5" stroke="#a8a29e" strokeWidth="1.2" />
      </g>

      <StatusBubble state={state} />
    </svg>
  );
}

function Hair({ meta }: { meta: AgentMeta }) {
  const c = meta.look.hair;
  switch (meta.look.hairStyle) {
    case "short":
      return <path d="M62.5 48 Q62 30 80 30 Q98 30 97.5 48 Q91 38 80 39 Q69 38 62.5 48Z" fill={c} />;
    case "bun":
      return (
        <g fill={c}>
          <circle cx="80" cy="27" r="7.5" />
          <path d="M62.5 49 Q62 31 80 31 Q98 31 97.5 49 Q93 39 80 38 Q67 39 62.5 49Z" />
        </g>
      );
    case "curly":
      return (
        <g fill={c}>
          <circle cx="65" cy="42" r="7" />
          <circle cx="72" cy="34" r="8" />
          <circle cx="80" cy="31" r="8" />
          <circle cx="88" cy="34" r="8" />
          <circle cx="95" cy="42" r="7" />
        </g>
      );
    case "long":
      return (
        <path
          d="M62 50 Q60 28 80 29 Q100 28 98 50 L99 72 Q94 74 92 66 L92 46 Q80 38 68 46 L68 66 Q66 74 61 72Z"
          fill={c}
        />
      );
    case "cap":
      return (
        <g>
          <path d="M62.5 45 Q64 28 80 28 Q96 28 97.5 45Z" fill="#0f766e" />
          <rect x="88" y="41" width="18" height="5" rx="2.5" fill="#115e59" />
          <rect x="63" y="44" width="5" height="7" rx="2" fill={c} />
        </g>
      );
    case "bald":
      return (
        <g fill={c}>
          <rect x="62" y="43" width="5" height="10" rx="2.5" />
          <rect x="93" y="43" width="5" height="10" rx="2.5" />
        </g>
      );
  }
}

function Accessory({ kind }: { kind: AgentMeta["accessory"] }): JSX.Element {
  switch (kind) {
    case "clipboard":
      return (
        <g transform="translate(112 80)">
          <rect width="18" height="19" rx="2" fill="#a16207" />
          <rect x="2.5" y="3" width="13" height="14" rx="1" fill="#fff" />
          <rect x="6" y="0" width="6" height="4" rx="1" fill="#57534e" />
          <path d="M5 8h8M5 11h8M5 14h5" stroke="#a8a29e" strokeWidth="1.2" />
        </g>
      );
    case "magnifier":
      return (
        <g transform="translate(112 80)" stroke="#334155" strokeWidth="2.5" fill="none">
          <circle cx="8" cy="8" r="6" fill="#e0f2fe" />
          <path d="M12.5 12.5 L19 19" strokeLinecap="round" />
        </g>
      );
    case "chess":
      return (
        <g transform="translate(114 78)" fill="#1e1b4b">
          <circle cx="7" cy="4" r="3.5" />
          <path d="M3 9 h8 l-1.5 8 h-5z" />
          <rect x="1" y="17" width="12" height="3.5" rx="1" />
        </g>
      );
    case "pen":
      return (
        <g transform="translate(112 82)">
          <rect x="2" y="6" width="14" height="13" rx="2" fill="#57534e" />
          <rect x="5" y="-2" width="3" height="12" rx="1" fill="#f43f5e" transform="rotate(-10 6 4)" />
          <rect x="10" y="-1" width="3" height="11" rx="1" fill="#0ea5e9" transform="rotate(8 11 4)" />
        </g>
      );
    case "palette":
      return (
        <g transform="translate(110 83)">
          <path d="M11 0 C4 0 0 5 0 9 C0 14 5 16 8 14 C10 13 11 15 12 16 C18 17 22 12 22 8 C22 3 17 0 11 0Z" fill="#fef3c7" />
          <circle cx="6" cy="6" r="2" fill="#f43f5e" />
          <circle cx="12" cy="4" r="2" fill="#0ea5e9" />
          <circle cx="17" cy="8" r="2" fill="#10b981" />
        </g>
      );
    case "shield":
      return (
        <g transform="translate(113 78)">
          <path d="M9 0 L18 3.5 V10 C18 16 13.5 19.5 9 21 C4.5 19.5 0 16 0 10 V3.5Z" fill="#475569" />
          <path d="M5 10.5 L8 13.5 L13.5 7.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

function StatusBubble({ state }: { state: VisualState }) {
  switch (state) {
    case "working":
      return (
        <g className="hm-bubble">
          <rect x="98" y="14" width="34" height="18" rx="9" fill="#fff" stroke="#e7e5e4" />
          <circle className="hm-dot hm-dot-1" cx="107" cy="23" r="2.4" fill="#f59e0b" />
          <circle className="hm-dot hm-dot-2" cx="115" cy="23" r="2.4" fill="#f59e0b" />
          <circle className="hm-dot hm-dot-3" cx="123" cy="23" r="2.4" fill="#f59e0b" />
        </g>
      );
    case "waiting":
      return (
        <g className="hm-zzz" fill="#a8a29e" fontFamily="ui-sans-serif, system-ui" fontWeight="700">
          <text x="100" y="30" fontSize="10">z</text>
          <text x="108" y="22" fontSize="8">z</text>
        </g>
      );
    case "needs_changes":
      return (
        <g className="hm-alert">
          <circle cx="112" cy="22" r="11" fill="#f59e0b" />
          <rect x="110.6" y="14.5" width="2.8" height="9" rx="1.4" fill="#fff" />
          <circle cx="112" cy="27.5" r="1.7" fill="#fff" />
        </g>
      );
    case "done":
      return (
        <g className="hm-check">
          <circle cx="112" cy="22" r="11" fill="#10b981" />
          <path d="M106.5 22.5 L110.5 26.5 L118 18.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      );
    case "error":
      return (
        <g className="hm-alert">
          <circle cx="112" cy="22" r="11" fill="#dc2626" />
          <path d="M107.5 17.5 L116.5 26.5 M116.5 17.5 L107.5 26.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      );
    case "handoff":
      return null;
  }
}
