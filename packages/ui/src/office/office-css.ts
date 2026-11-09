/** Animations for the office sprites. Injected once by <OfficeScene>. */
export const OFFICE_CSS = `
.hm-sprite { overflow: visible; }
.hm-sprite .hm-glow, .hm-sprite .hm-paper, .hm-sprite .hm-steam { opacity: 0; }
.hm-sprite .hm-body { animation: hm-breathe 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.hm-sprite .hm-eyes { animation: hm-blink 5s infinite; transform-box: fill-box; transform-origin: 50% 50%; }
.hm-sprite .hm-arm-l, .hm-sprite .hm-arm-r { transform-box: fill-box; transform-origin: 50% 0%; transition: transform .3s ease; }

.hm-sprite[data-state="waiting"] .hm-steam { opacity: .9; animation: hm-steam 2.4s ease-in-out infinite; }
.hm-sprite[data-state="waiting"] .hm-zzz { animation: hm-float 2.8s ease-in-out infinite; }

.hm-sprite[data-state="working"] .hm-glow { animation: hm-glow 1.6s ease-in-out infinite; }
.hm-sprite[data-state="working"] .hm-arm-l { animation: hm-type .28s ease-in-out infinite alternate; }
.hm-sprite[data-state="working"] .hm-arm-r { animation: hm-type .28s ease-in-out infinite alternate-reverse; }
.hm-sprite[data-state="working"] .hm-eyes { transform: translateY(1.5px); animation: none; }
.hm-sprite[data-state="working"] .hm-dot { animation: hm-dot 1.1s ease-in-out infinite; transform-box: fill-box; }
.hm-sprite[data-state="working"] .hm-dot-2 { animation-delay: .15s; }
.hm-sprite[data-state="working"] .hm-dot-3 { animation-delay: .3s; }

.hm-sprite[data-state="handoff"] .hm-paper { animation: hm-paper 1.5s ease-in infinite; }
.hm-sprite[data-state="handoff"] .hm-arm-r { transform: translate(6px, -4px) rotate(-40deg); }

.hm-sprite[data-state="needs_changes"] .hm-arm-r { transform: translate(10px, -24px) rotate(160deg); }
.hm-sprite[data-state="needs_changes"] .hm-alert, .hm-sprite[data-state="error"] .hm-alert { animation: hm-bounce .9s ease-in-out infinite; }

.hm-sprite[data-state="done"] .hm-check { animation: hm-pop .5s cubic-bezier(.2,1.6,.4,1) both; transform-box: fill-box; transform-origin: 50% 50%; }
.hm-sprite[data-state="done"] .hm-arm-l { transform: translate(-2px, 2px) rotate(8deg); }
.hm-sprite[data-state="done"] .hm-arm-r { transform: translate(2px, 2px) rotate(-8deg); }

@keyframes hm-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.2px); } }
@keyframes hm-blink { 0%,94%,100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
@keyframes hm-type { from { transform: translateY(0); } to { transform: translateY(-2.5px); } }
@keyframes hm-glow { 0%,100% { opacity: .15; } 50% { opacity: .4; } }
@keyframes hm-dot { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-3px); } }
@keyframes hm-steam { 0% { transform: translateY(2px); opacity: 0; } 40% { opacity: .9; } 100% { transform: translateY(-6px); opacity: 0; } }
@keyframes hm-float { 0%,100% { transform: translateY(0); opacity: .9; } 50% { transform: translateY(-4px); opacity: .5; } }
@keyframes hm-paper { 0% { transform: translate(0,0) rotate(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(58px,-34px) rotate(25deg); opacity: 0; } }
@keyframes hm-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes hm-pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }

@media (prefers-reduced-motion: reduce) {
  .hm-sprite, .hm-sprite * { animation: none !important; transition: none !important; }
  .hm-sprite[data-state="handoff"] .hm-paper { opacity: 1; transform: translate(30px,-16px); }
}
`;
