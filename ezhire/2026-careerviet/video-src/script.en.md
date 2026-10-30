# CareerViet test demo · Google AI Studio script (EN)

Same wording as the built-in voiceover in `build.mjs` (`lines`), tuned for TTS. If the wording changes, change `build.mjs` first.

## Settings

| Setting | Value |
|---|---|
| Page | `aistudio.google.com/generate-speech` → Playground |
| Model | Gemini 3.8 Flash TTS (`gemini-3.8-flash-tts`) |
| Speaker | **Rami** (Speaker 1, one speech block) |
| Style | **Narration** · Expression: none · Temperature: default |
| Style instruction | English narrator for a short how-to video that helps a recruiting team in Vietnam test a new feature. Friendly, calm and very clear, like a helpful colleague. Slightly slow, easy for non-native English listeners. Neutral accent. Pause at every “…” and at every <breath>. Pronounce EZHire as “EE-zee-hire”, CareerViet as “career-vee-ET”, staging as “STAY-jing”. |

## Paste into one speech block

```text
Hi team! Here is how to test CareerViet with EZHire staging… in five simple steps.

<breath>

Step one. On CareerViet, create a test job. Put a job code at the end of the title, like two-six-three-seven-three. Then set the application email to V-I, dash, careerviet, at ezhire dot asia.

<breath>

Step two. On EZHire staging, create the same job. Open it, click the Synced with Job Board tab, click Edit, then Add Job Board. Choose CareerViet, type the job code only, and click Add. The code must be exactly the same in both places.

<breath>

Step three. Back on CareerViet, apply to your test job once. Please use a dummy name and a dummy CV.

<breath>

Step four. Wait a few minutes. Then open Talent Pool in EZHire. Your test candidate appears with a CareerViet tag.

<breath>

Step five. Tell us in the chat when you are done. Thank you!
```

## After the take

1. Download the WAV → `video-src/narration.en.wav`.
2. The scenes are timed to the current voiceover, so the new WAV needs its scene starts re-timed (split per step, or ask to re-run the build with it).
3. Check every word against this script.
