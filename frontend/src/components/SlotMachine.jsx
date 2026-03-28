import { useRef, useState, useEffect, useCallback } from "react";
import { FILLER, TARGET, REEL_HEIGHT } from "../data/constants";

/**
 * Three-reel slot machine that spells out TARGET words on spin.
 * Wraps the machine + lever UI. Click anywhere on the wrapper to spin.
 */
export default function SlotMachine() {
  const stripsRef = useRef([]);
  const [spinning, setSpinning] = useState(false);
  const [jackpot, setJackpot] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [leverText, setLeverText] = useState("⬡ Spin");
  const [winLineClass, setWinLineClass] = useState("");

  // Build reel DOM once on mount
  useEffect(() => {
    TARGET.forEach((_, ri) => {
      const strip = stripsRef.current[ri];
      if (!strip) return;
      strip.innerHTML = "";

      const pool = FILLER[ri];
      const items = [...pool, ...pool, ...pool, ...pool, TARGET[ri]];

      items.forEach((w, i) => {
        const el = document.createElement("div");
        el.className =
          "reel-word" + (i === items.length - 1 ? " is-target" : "");
        el.textContent = w;
        strip.appendChild(el);
      });

      strip._targetIdx = items.length - 1;
      strip._poolLen = items.length - 1;
      strip.style.transition = "none";
      strip.style.transform = `translateY(-${strip._targetIdx * REEL_HEIGHT}px)`;
    });
  }, []);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setJackpot(false);
    setGlowing(false);
    setWinLineClass("");
    setLeverText("⬡ Spinning…");

    const stopAt = [1900, 2800, 3700];

    TARGET.forEach((_, ri) => {
      const strip = stripsRef.current[ri];

      // clear target highlights
      strip.querySelectorAll(".reel-word").forEach((el) => {
        el.classList.remove("is-target");
        el.style.textShadow = "";
        el.style.color = "";
        el.style.opacity = "";
      });

      strip.style.transition = "none";
      strip.style.transform = "translateY(0px)";
      strip.getBoundingClientRect(); // force reflow

      let pos = 0,
        speed = 45;
      const t0 = performance.now();

      function step(now) {
        const elapsed = now - t0;
        const ratio = elapsed / stopAt[ri];
        speed = ratio < 0.4 ? 45 : ratio < 0.65 ? 90 : ratio < 0.82 ? 165 : 290;

        pos = (pos + 1) % strip._poolLen;
        strip.style.transition = `transform ${Math.round(speed * 0.78)}ms linear`;
        strip.style.transform = `translateY(-${pos * REEL_HEIGHT}px)`;

        if (elapsed < stopAt[ri]) {
          setTimeout(() => requestAnimationFrame(step), speed);
        } else {
          // settle on target
          setTimeout(() => {
            strip.style.transition =
              "transform 520ms cubic-bezier(0.15,1.6,0.38,1)";
            strip.style.transform = `translateY(-${strip._targetIdx * REEL_HEIGHT}px)`;

            setTimeout(() => {
              strip
                .querySelectorAll(".reel-word")
                [strip._targetIdx].classList.add("is-target");

              if (ri === 2) {
                // last reel stopped — jackpot!
                setJackpot(true);
                setWinLineClass("jackpot-line");

                TARGET.forEach((_, ri2) => {
                  const s = stripsRef.current[ri2];
                  const el = s.querySelectorAll(".reel-word")[s._targetIdx];
                  let n = 0;
                  const iv = setInterval(() => {
                    el.style.textShadow =
                      n % 2 === 0
                        ? "0 0 80px rgba(226,188,114,1)"
                        : "0 0 28px rgba(226,188,114,.65)";
                    el.style.color =
                      n % 2 === 0 ? "#fff8d0" : "var(--gold-bright,#e2bc72)";
                    if (++n >= 8) {
                      clearInterval(iv);
                      el.style.textShadow = "0 0 40px rgba(226,188,114,.85)";
                      el.style.color = "#fff0c0";
                    }
                  }, 210);
                });

                setTimeout(() => {
                  setJackpot(false);
                  setGlowing(true);
                  setWinLineClass("");
                  setLeverText("⬡ Spin Again");
                  setSpinning(false);
                }, 2500);
              }
            }, 540);
          }, 55);
        }
      }

      setTimeout(() => requestAnimationFrame(step), ri * 180);
    });
  }, [spinning]);

  return (
    <div
      style={{
        display: "block",
        margin: ".5rem 0 .75rem",
        cursor: "pointer",
        userSelect: "none",
        width: "100%",
      }}
      onClick={spin}
    >
      <div style={{ position: "relative", display: "block", width: "100%" }}>
        <div className={`win-line${winLineClass ? " " + winLineClass : ""}`} />
        <div
          className={`slot-machine${jackpot ? " jackpot" : ""}${glowing ? " glowing" : ""}`}
        >
          {[0, 1, 2].map((ri) => (
            <div className="slot-reel" key={ri}>
              <div
                className="reel-strip"
                ref={(el) => (stripsRef.current[ri] = el)}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 12,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: ".6rem",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--gold-dark,#7a6238)",
          }}
        >
          ↻ click to spin
        </span>
        <button
          className={`slot-lever${spinning ? " spinning" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            spin();
          }}
        >
          {leverText}
        </button>
      </div>
    </div>
  );
}
