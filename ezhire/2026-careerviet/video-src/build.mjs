// Usage: node build.mjs   (needs playwright from the inhouse-ats checkout, macOS `say`, ffmpeg)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire('/Users/rcn-ab-26002/Documents/ruby/inhouse-ats/package.json');
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..');
const tmp = path.join(here, '.tmp');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);

const lines = [
  'Hi team! Here is how to test CareerViet with EZHire staging. It takes five simple steps.',
  'Step one. On CareerViet, create a test job. Put a job code at the end of the title, like twenty-six three seven three. Then set the application email to vi, dash, careerviet, at ezhire dot asia.',
  'Step two. On EZHire staging, create the same job. Open it, click the Synced with Job Board tab, click Edit, then Add Job Board. Choose CareerViet, type the job code only, and click Add. The code must be exactly the same in both places.',
  'Step three. Back on CareerViet, apply to your test job once. Please use a dummy name and a dummy CV.',
  'Step four. Wait a few minutes. Then open Talent Pool in EZHire. Your test candidate appears with a CareerViet tag.',
  'Step five. Tell us in the chat when you are done. Thank you!'
];

const subs = [
  'Test CareerViet with EZHire staging in 5 simple steps.',
  'Step 1 · On CareerViet: put a job code at the end of the title, and set the email to vi-careerviet@ezhire.asia',
  'Step 2 · On EZHire: open the job → Synced with Job Board tab → Edit → Add Job Board. The code must match exactly.',
  'Step 3 · Apply to your test job once with a dummy name and CV.',
  'Step 4 · Wait a few minutes. The candidate appears in Talent Pool with a CareerViet tag.',
  'Step 5 · Tell us in the chat when you are done. Thank you!'
];
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' });
const dur = f => parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));

const EXT = process.env.WAV; // external narration, scene starts below were found with ffmpeg silencedetect
const EXT_STARTS = [0, 6.12, 18.93, 32.03, 41.99, 49.53], EXT_END = 53.3;
const wavs = EXT ? [EXT] : lines.map((l, i) => {
  const f = path.join(tmp, `n${i}.wav`);
  sh('say', ['-v', 'Samantha', '-r', '165', '-o', f, '--data-format=LEI16@44100', l]);
  return f;
});
const minDur = EXT ? EXT_STARTS.map((s, i) => (EXT_STARTS[i + 1] ?? EXT_END) - s) : wavs.map(w => dur(w) + 1.2);

const browser = await chromium.launch();
let speeds;
if (EXT) {
  // Dry run at normal speed to measure how long each scene's actions take, then speed up the ones that overrun.
  const dry = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await dry.goto('file://' + path.join(here, 'replica.html'));
  await dry.evaluate(([d, l]) => { window.run(d, l); }, [minDur.map(() => 0), subs]);
  await dry.waitForFunction(() => window.done, null, { timeout: 180000, polling: 250 });
  const s = await dry.evaluate(() => [...window.starts, window.total]);
  speeds = minDur.map((d, i) => Math.max(1, (s[i + 1] - s[i]) / (d - 0.3)));
  console.log({ natural: s, speeds });
  await dry.context().close();
}
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: tmp, size: { width: 1280, height: 720 } }
});
const page = await ctx.newPage();
await page.goto('file://' + path.join(here, 'replica.html'));
await page.waitForTimeout(500);
const t0 = Date.now();
await page.evaluate(([d, l]) => { window.run(d, l); }, [minDur, subs, speeds]);
await page.waitForFunction(() => window.done, null, { timeout: 180000, polling: 250 });
const starts = await page.evaluate(() => window.starts);
const total = await page.evaluate(() => window.total);
await page.waitForTimeout(600);
await ctx.close();
await browser.close();

const webm = path.join(tmp, readdirSync(tmp).find(f => f.endsWith('.webm')));
// Video begins when the page opens; scene 0 starts ~0.5 s + load time later.
const offset = 0.9;
const inputs = wavs.flatMap(w => ['-i', w]);
const lead = EXT ? 0 : 0.4;
const delays = starts.slice(0, wavs.length === 1 ? 1 : undefined).map((s, i) => `[${i + 1}:a]adelay=${Math.round((EXT ? 0 + offset : s + offset + lead) * 1000)}|${Math.round((EXT ? offset : s + offset + lead) * 1000)}[a${i}]`);
const n = delays.length;
const mix = delays.join(';') + ';' + delays.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${n}:normalize=0[aout]`;

sh('ffmpeg', ['-y', '-i', webm, ...inputs, '-filter_complex', mix, '-map', '0:v', '-map', '[aout]',
  '-t', String(total + offset + 0.8), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow',
  '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path.join(out, 'demo.mp4')]);
sh('ffmpeg', ['-y', '-ss', '14', '-i', path.join(out, 'demo.mp4'), '-frames:v', '1', '-q:v', '3', path.join(out, 'poster.jpg')]);
rmSync(tmp, { recursive: true, force: true });
console.log('done', { starts, total, elapsed: (Date.now() - t0) / 1000 });
