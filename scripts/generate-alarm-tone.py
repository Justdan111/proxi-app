#!/usr/bin/env python3
"""
Generates assets/sounds/proxi_alert.wav — the arrival alarm.

Run:  python3 scripts/generate-alarm-tone.py

Why this exists as a script rather than a checked-in blob: the tone is
synthesised, so keeping the generator means the pattern can be retuned later
without reverse-engineering a WAV.

Constraints it has to satisfy:
  * 30 seconds is iOS's hard cap for a custom notification sound.
  * Filename must be lowercase letters, digits and underscores only — Android
    resource names reject hyphens, and a rejected name falls back to the
    default sound silently, with no build error.
  * Fundamentals sit between 800 Hz and 1.2 kHz. Phone speakers roll off below
    roughly 500 Hz, so a lower tone loses most of its level on the device that
    actually has to play it.
"""

import array
import math
import os
import wave

SAMPLE_RATE = 44100
DURATION_TARGET = 24.0          # inside the 30s iOS cap, long enough to be an alarm

BEEP = 0.22                     # length of one tone
GAP = 0.06                      # silence between tones within a burst
REST = 0.88                     # silence after a burst, before the next
TONES = [880.0, 1108.73, 880.0, 1108.73]   # A5 / C#6 alternating — a two-tone alarm

ATTACK = 0.008                  # short, but not instant: a hard edge clicks
RELEASE = 0.030
PEAK = 0.89                     # just under full scale

# A pure sine is easy to miss on a small speaker. A little harmonic content
# gives the tone edges to cut through ambient noise without being shrill.
HARMONICS = [(1.0, 1.00), (2.0, 0.35), (3.0, 0.12)]
HARMONIC_SUM = sum(level for _, level in HARMONICS)


def envelope(index: int, total: int) -> float:
    attack = int(ATTACK * SAMPLE_RATE)
    release = int(RELEASE * SAMPLE_RATE)
    if index < attack:
        return index / attack
    if index > total - release:
        return max(0.0, (total - index) / release)
    return 1.0


def beep(frequency: float) -> array.array:
    total = int(BEEP * SAMPLE_RATE)
    out = array.array("d", [0.0] * total)
    for i in range(total):
        t = i / SAMPLE_RATE
        value = sum(
            level * math.sin(2.0 * math.pi * frequency * multiple * t)
            for multiple, level in HARMONICS
        )
        out[i] = (value / HARMONIC_SUM) * envelope(i, total)
    return out


def silence(seconds: float) -> array.array:
    return array.array("d", [0.0] * int(seconds * SAMPLE_RATE))


def build() -> array.array:
    cycle = array.array("d")
    for tone in TONES:
        cycle.extend(beep(tone))
        cycle.extend(silence(GAP))
    cycle.extend(silence(REST))

    cycle_seconds = len(cycle) / SAMPLE_RATE
    repeats = int(DURATION_TARGET / cycle_seconds)

    track = array.array("d")
    for _ in range(repeats):
        track.extend(cycle)
    return track


def main() -> None:
    track = build()

    peak = max(abs(v) for v in track) or 1.0
    scale = (PEAK / peak) * 32767.0
    pcm = array.array("h", (int(max(-32768, min(32767, v * scale))) for v in track))

    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target = os.path.join(here, "assets", "sounds", "proxi_alert.wav")

    with wave.open(target, "w") as out:
        out.setnchannels(1)          # mono — half the size, no loss for an alert tone
        out.setsampwidth(2)          # 16-bit linear PCM
        out.setframerate(SAMPLE_RATE)
        out.writeframes(pcm.tobytes())

    seconds = len(pcm) / SAMPLE_RATE
    size_kb = os.path.getsize(target) / 1024
    print(f"wrote {target}")
    print(f"  {seconds:.2f}s | mono | {SAMPLE_RATE} Hz | 16-bit | {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
